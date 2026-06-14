"""
Dependencies handle request-time auth and app logic 
that doesn't fit in the models or crud layers.
"""

import os
from typing import Any

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from . import crud
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="unused-with-zitadel")

ZITADEL_ISSUER_URL = os.getenv("ZITADEL_ISSUER_URL", "").rstrip("/")
ZITADEL_AUDIENCE = os.getenv("ZITADEL_AUDIENCE", "")

_openid_config: dict[str, Any] | None = None
_jwks: dict[str, Any] | None = None


def get_openid_config() -> dict[str, Any]:
    """
     Return Zitadel's OpenID Connect discovery document

    This function loads the standard OpenID Connect metadata document from
    the issuer's `/.well-known/openid-configuration` endpoint and caches the
    result in the module-level `_openid_config` variable.

    The discovery document is a JSON object published by an OpenID Connect
    provider. It contains important metadata such as:
    - the issuer identifier
    - the authorization endpoint
    - the token endpoint
    - the JWKS URI, which tells clients where to fetch public signing keys

    Why this function exists:
    - The backend should not hardcode all OIDC-related URLs.
    - It should discover them dynamically from the issuer.
    - The result is cached so the application does not make an HTTP request
      on every authenticated API call.

    Returns:
        dict[str, Any]:
            The parsed OpenID Connect discovery document returned by Zitadel.

    Notes:
        The issuer URL is normalized with `rstrip("/")` at module load time to
        avoid mismatches caused by trailing slashes in environment variables.
    """
    global _openid_config

    if _openid_config is None:
        if not ZITADEL_ISSUER_URL:
            raise RuntimeError("ZITADEL_ISSUER_URL is not configured")

        response = requests.get(
            f"{ZITADEL_ISSUER_URL}/.well-known/openid-configuration",
            timeout=5,
        )
        response.raise_for_status()
        _openid_config = response.json()

    return _openid_config

# A JWKS is a JSON list of public keys.
# our backend does not usually get “the public key” as 
# a simple password-looking string.
# Instead it gets structured key data, often including:
# kid: key ID
# kty: key type
# n: modulus
# e: exponent
# algorithm metadata
def get_jwks() -> dict[str, Any]:
    """
    Return the JSON Web Key Set used to verify Zitadel-issued JWTs.

    This function retrieves the JWKS document from the `jwks_uri` declared in
    the OpenID Connect discovery document and caches it in the module-level
    `_jwks` variable.

    A JWKS, or JSON Web Key Set, is a JSON structure containing one or more
    public keys. These public keys are used to verify JWT signatures created
    by the identity provider's private key. In this application, the JWKS is
    used to verify access tokens issued by Zitadel.

    Why this function exists:
    - JWTs signed with RS256 must be verified with a public key.
    - The backend does not store Zitadel's private key.
    - Instead, it fetches the public keys published by Zitadel.
    - The result is cached so repeated authentication checks are fast.

    Returns:
        dict[str, Any]:
            The parsed JWKS document, typically containing a `keys` list.

    Notes:
        This function depends on `get_openid_config()` to locate the correct
        JWKS endpoint rather than hardcoding that URL.
    """
    global _jwks

    if _jwks is None:
        openid_config = get_openid_config()
        jwks_uri = openid_config["jwks_uri"]

        response = requests.get(jwks_uri, timeout=5)
        response.raise_for_status()
        _jwks = response.json()

    return _jwks


def verify_oidc_token(token: str) -> dict[str, Any]:
    """
    Verify a Zitadel-issued OIDC access token and return its claims.

    This function performs the core token validation logic for authenticated
    requests. It verifies that the provided JWT:
    - contains a key identifier (`kid`) in its header
    - can be matched to a public signing key from Zitadel's JWKS
    - has a valid RS256 signature
    - was issued by the configured issuer
    - is intended for the configured audience, if an audience is set

    Authentication flow:
    1. Read the token header without trusting it yet.
    2. Extract the `kid` field from the header.
    3. Load the JWKS and find the matching public key.
    4. Decode and verify the token with `python-jose`.
    5. Return the verified payload if all checks succeed.

    Parameters:
        token (str):
            The raw JWT access token extracted from the `Authorization:
            Bearer <token>` header.

    Returns:
        dict[str, Any]:
            The decoded JWT payload, also called the token claims. This will
            typically contain fields such as `sub`, `iss`, `aud`, and `exp`.

    Security notes:
        - The function uses the token's `kid` header only to choose the correct
          public key. The header is not trusted by itself.
        - Trust is established only after signature verification succeeds.
        - Restricting algorithms to `RS256` prevents accepting unexpected
          algorithms.
        - Issuer and audience checks reduce the risk of accepting a token
          issued for a different service.

    Notes:
        If `ZITADEL_AUDIENCE` is empty, audience validation is effectively
        disabled by the current implementation. In production systems,
        validating audience is strongly recommended.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise credentials_exception

        jwks = get_jwks()
        # look through the public keys
        # find the one whose kid matches the token header
        # use that key to verify the signature
        signing_key = next(
            (key for key in jwks.get("keys", []) if key.get("kid") == kid),
            None,
        )
        if signing_key is None:
            raise credentials_exception

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=ZITADEL_ISSUER_URL,
            audience=ZITADEL_AUDIENCE if ZITADEL_AUDIENCE else None,
        )
        return payload

    except JWTError:
        raise credentials_exception


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: str = Depends(get_db),
) -> User:
    """
    Resolve the authenticated request into the local application user.

    This FastAPI dependency is intended to be used by protected endpoints.
    It performs two separate responsibilities:

    1. Authentication:
       Validate the incoming bearer token using `verify_oidc_token()`.

    2. Application user mapping:
       Extract the Zitadel subject identifier from the verified token and use
       it to look up the corresponding local `User` document in MongoDB.

    The `sub` claim, short for "subject", is the stable unique identifier for
    the authenticated user in the identity provider. This application uses
    that external identity to find the matching internal user record.

    Parameters:
        token (str):
            The bearer token extracted automatically by FastAPI from the
            incoming request's `Authorization` header.
        db (str):
            The database alias or database context provided by `get_db()`.

    Returns:
        User:
            The local MongoDB `User` object associated with the authenticated
            Zitadel subject.

    Notes:
        This function assumes the existence of `crud.get_user_by_zitadel_sub`.
        If that CRUD helper or the `zitadel_sub` field does not yet exist in
        the model layer, this function represents the intended target design
        but will not work until those pieces are implemented.

    Typical usage:
        This function is meant to be injected into route handlers with
        `Depends(get_current_user)`, allowing protected routes to receive the
        authenticated local user automatically.
    """
    payload = verify_oidc_token(token)

    zitadel_sub = payload.get("sub")
    if not zitadel_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = crud.get_user_by_zitadel_sub(zitadel_sub, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
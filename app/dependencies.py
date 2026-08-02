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

# We require certain environment variables to be set for Zitadel integration.
# especially the issuer URL and audience in verifying oidc tokens
def require_env(name: str) -> str:
    """
    Read an environment variable and raise an error at import time if missing.
    
    This enforces that the application cannot start without the required
    Zitadel configuration. Failing at startup with a clear message is far
    better than silently rejecting every authenticated request at runtime.
    """
    value =os.getenv(name)
    if not value:
        raise RuntimeError(f"Environment variable {name} is required but not set")
    return value

ZITADEL_ISSUER_URL = require_env("ZITADEL_ISSUER_URL").rstrip("/")
ZITADEL_AUDIENCE = require_env("ZITADEL_AUDIENCE")


# Caching for OpenID Connect discovery and JWKS
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
    """
    global _openid_config

    if _openid_config is None:
        # ZITADEL_ISSUER_URL is guaranteed to be set — validated at startup
        # by require_env(). No need to check it here.
        try:
            response = requests.get(
                f"{ZITADEL_ISSUER_URL}/.well-known/openid-configuration",
                timeout=5,
            )
            response.raise_for_status()
            _openid_config = response.json()
        except requests.exceptions.RequestException as e:
            # Zitadel is unreachable or returned an error.
            # Raise 503 (Service Unavailable) instead of letting a raw
            # network exception become an unhandled 500.
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is unavailable. Please try again later.",
            ) from e

    return _openid_config

# A JWKS is a JSON list of public keys.
# A JWKS, or JSON Web Key Set, is a JSON structure containing one or more
# public keys. These public keys are used to verify JWT signatures created
# by the identity provider's private key. In this application, the JWKS is
# used to verify access tokens issued by Zitadel.
# our backend does not usually get “the public key” as 
# a simple password-looking string.
# Instead it gets structured key data, often including:
# kid: key ID
# kty: key type
# n: modulus
# e: exponent
# algorithm metadata
def get_jwks(force_refresh: bool = False) -> dict[str, Any]:
    """
    Return the JSON Web Key Set used to verify Zitadel-issued JWTs.

    This function retrieves the JWKS document from the `jwks_uri` declared in
    the OpenID Connect discovery document and caches it in the module-level
    `_jwks` variable.

    workflow:
    - JWTs signed with RS256 must be verified with a public key.
    - The backend does not store Zitadel's private key.
    - Instead, it fetches the public keys published by Zitadel.
    - The result is cached so repeated authentication checks are fast.
    """
    global _jwks

    if _jwks is None or force_refresh:
        openid_config = get_openid_config()
        jwks_uri = openid_config["jwks_uri"]

        try:
            response = requests.get(jwks_uri, timeout=5)
            response.raise_for_status()
            _jwks = response.json()
        except requests.exceptions.RequestException as e:
            # Zitadel's key endpoint is unreachable.
            # Raise 503 so the caller receives a meaningful error instead
            # of a raw network exception becoming an unhandled 500.
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is unavailable. Please try again later.",
            ) from e

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
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        jwks = get_jwks()
        # look through the public keys
        # find the one whose kid matches the token header
        # use that key to verify the signature
        signing_key = next(
            (key for key in jwks.get("keys", []) if key.get("kid") == kid),
            None,
        )

        if signing_key is None:
            # kid not in cache — Zitadel may have rotated its signing keys.
            # Fetch a fresh JWKS once before rejecting the token.
            jwks = get_jwks(force_refresh=True)
            signing_key = next(
                (key for key in jwks.get("keys", []) if key.get("kid") == kid),
                None,
            )

        if not kid or signing_key is None:
            raise credentials_exception

        payload = jwt.decode(token,
                             signing_key,
                             algorithms=["RS256"],
                             issuer=ZITADEL_ISSUER_URL,
                             audience=ZITADEL_AUDIENCE,
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
        email = payload.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing email claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user=User(username=email, email=email, zitadel_sub=zitadel_sub)
        user.save(using=db)
    return user
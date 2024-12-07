from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from .security import verify_password
from .logger import logger

# Secret key to encode JWT tokens
# In production, use a more secure method to manage the secret key
SECRET_KEY = "your_secret_key_here"  # Replace with your secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token validity


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(tz=timezone.utc) + expires_delta
    else:
        expire = datetime.now(tz=timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, credentials_exception):
    """
    Verifies a JWT token and returns the payload.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return payload
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise credentials_exception

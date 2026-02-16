"""
Storage configuration API endpoints.
Allows users to configure Telegram or Google Drive for file storage.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
import os
from typing import Optional
from .. import schemas, models
from ..database import get_db
from ..utils.token import get_current_user
from ..utils.storage_adapter import TelegramStorageAdapter

router = APIRouter(prefix="/storage", tags=["storage"])

# Google OAuth2 configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/storage/oauth2callback")

SCOPES = ['https://www.googleapis.com/auth/drive.file']


@router.post("/configure/telegram")
def configure_telegram(
    config: schemas.TelegramStorageConfig,
    db: str = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Configure Telegram storage for the current user.
    Users must provide their own Telegram bot token and user ID.
    """
    try:
        # Validate bot token by making a test API call
        adapter = TelegramStorageAdapter(bot_token=config.bot_token)
        
        # Test the bot token
        import requests
        test_url = f"https://api.telegram.org/bot{config.bot_token}/getMe"
        response = requests.get(test_url)
        
        if not response.json().get('ok'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Telegram bot token"
            )
        
        # Update user's storage config
        if not current_user.storage_config:
            current_user.storage_config = models.UserStorageConfig()
        
        current_user.storage_config.storage_type = 'telegram'
        current_user.storage_config.telegram_bot_token = config.bot_token
        current_user.storage_config.telegram_user_id = config.user_id
        current_user.save(using=db)
        
        return {
            "message": "Telegram storage configured successfully",
            "storage_type": "telegram",
            "user_id": config.user_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to configure Telegram storage: {str(e)}"
        )


@router.get("/configure/google-drive/auth")
def initiate_google_drive_auth(
    current_user: models.User = Depends(get_current_user)
):
    """
    Initiate Google Drive OAuth flow.
    Returns the authorization URL for the user to visit.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Drive integration not configured on server"
        )
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        },
        scopes=SCOPES
    )
    
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=str(current_user.id)  # Store user ID in state
    )
    
    return {
        "authorization_url": authorization_url,
        "message": "Visit the authorization URL to grant access"
    }


@router.get("/oauth2callback")
async def google_drive_oauth_callback(
    code: str,
    state: str,
    db: str = Depends(get_db)
):
    """
    Handle Google OAuth callback.
    Exchanges code for credentials and stores them.
    """
    try:
        # Get user from state
        from bson import ObjectId
        user = models.User.objects(id=ObjectId(state)).using(db).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            state=state
        )
        
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Store credentials
        if not user.storage_config:
            user.storage_config = models.UserStorageConfig()
        
        user.storage_config.storage_type = 'google_drive'
        user.storage_config.google_credentials = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        user.storage_config.google_refresh_token = credentials.refresh_token
        user.save(using=db)
        
        # Redirect to frontend success page
        return RedirectResponse(url="http://localhost:5173/settings/storage?success=true")
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.get("/config", response_model=schemas.StorageConfigResponse)
def get_storage_config(
    db: str = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current user's storage configuration and quota information.
    """
    return schemas.StorageConfigResponse(
        storage_type=current_user.storage_config.storage_type if current_user.storage_config else None,
        is_configured=bool(current_user.storage_config and (
            current_user.storage_config.telegram_bot_token or
            current_user.storage_config.google_credentials
        )),
        quota=schemas.StorageQuota(
            used_bytes=current_user.storage_used_bytes,
            max_bytes=current_user.max_storage_bytes,
            file_count=current_user.file_count,
            max_files=current_user.max_files,
            subscription_tier=current_user.subscription_tier
        )
    )


@router.get("/quota", response_model=schemas.StorageQuota)
def get_storage_quota(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get storage quota information for the current user.
    """
    return schemas.StorageQuota(
        used_bytes=current_user.storage_used_bytes,
        max_bytes=current_user.max_storage_bytes,
        file_count=current_user.file_count,
        max_files=current_user.max_files,
        subscription_tier=current_user.subscription_tier
    )


@router.post("/disconnect")
def disconnect_storage(
    db: str = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Disconnect current storage configuration.
    Note: This doesn't delete files, only clears the configuration.
    """
    if current_user.file_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disconnect storage while you have uploaded files. Delete all files first."
        )
    
    current_user.storage_config = None
    current_user.save(using=db)
    
    return {"message": "Storage disconnected successfully"}

"""
File storage adapters for Telegram and Google Drive.
Allows users to configure which storage backend to use.
"""
from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
import os
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
import io


class StorageAdapter(ABC):
    """Abstract base class for storage adapters"""
    
    @abstractmethod
    def upload_file(self, file_data: bytes, filename: str, user_id: str) -> str:
        """Upload a file and return the file identifier"""
        pass
    
    @abstractmethod
    def download_file(self, file_id: str) -> bytes:
        """Download a file by its identifier"""
        pass
    
    @abstractmethod
    def delete_file(self, file_id: str) -> bool:
        """Delete a file by its identifier"""
        pass
    
    @abstractmethod
    def get_file_info(self, file_id: str) -> dict:
        """Get file metadata"""
        pass


class TelegramStorageAdapter(StorageAdapter):
    """
    Storage adapter using Telegram Bot API.
    Files are stored in the user's Telegram account via their bot.
    """
    
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    def upload_file(self, file_data: bytes, filename: str, user_id: str) -> str:
        """
        Upload file to Telegram using user's bot token.
        Returns the file_id from Telegram.
        
        Args:
            file_data: Binary file content
            filename: Original filename
            user_id: Telegram user ID (chat_id for saved messages)
        
        Returns:
            Telegram file_id
        """
        url = f"{self.base_url}/sendDocument"
        
        files = {
            'document': (filename, file_data, 'application/pdf')
        }
        data = {
            'chat_id': user_id,  # User's own chat_id for Saved Messages
            'caption': f'Flashcard Book: {filename}'
        }
        
        response = requests.post(url, files=files, data=data)
        response.raise_for_status()
        
        result = response.json()
        if result.get('ok'):
            file_id = result['result']['document']['file_id']
            return file_id
        else:
            raise Exception(f"Telegram upload failed: {result.get('description')}")
    
    def download_file(self, file_id: str) -> bytes:
        """Download file from Telegram"""
        # First, get file path
        url = f"{self.base_url}/getFile"
        response = requests.post(url, data={'file_id': file_id})
        response.raise_for_status()
        
        result = response.json()
        if result.get('ok'):
            file_path = result['result']['file_path']
            
            # Download the file
            download_url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
            file_response = requests.get(download_url)
            file_response.raise_for_status()
            
            return file_response.content
        else:
            raise Exception(f"Telegram download failed: {result.get('description')}")
    
    def delete_file(self, file_id: str) -> bool:
        """
        Note: Telegram doesn't support deleting messages via Bot API easily.
        This is a limitation. We'll mark as deleted in our DB instead.
        """
        # Telegram Bot API doesn't support deleteMessage for documents easily
        # We handle deletion at the application level
        return True
    
    def get_file_info(self, file_id: str) -> dict:
        """Get file metadata from Telegram"""
        url = f"{self.base_url}/getFile"
        response = requests.post(url, data={'file_id': file_id})
        response.raise_for_status()
        
        result = response.json()
        if result.get('ok'):
            return {
                'file_id': result['result']['file_id'],
                'file_size': result['result'].get('file_size', 0),
                'file_path': result['result'].get('file_path', '')
            }
        else:
            raise Exception(f"Failed to get file info: {result.get('description')}")


class GoogleDriveStorageAdapter(StorageAdapter):
    """
    Storage adapter using Google Drive API.
    Files are stored in the user's Google Drive.
    """
    
    def __init__(self, credentials_dict: dict):
        """
        Initialize with user's OAuth credentials.
        
        Args:
            credentials_dict: Dict containing access_token, refresh_token, etc.
        """
        self.credentials = Credentials.from_authorized_user_info(credentials_dict)
        self.service = build('drive', 'v3', credentials=self.credentials)
    
    def upload_file(self, file_data: bytes, filename: str, user_id: str) -> str:
        """
        Upload file to Google Drive.
        
        Args:
            file_data: Binary file content
            filename: Original filename
            user_id: User ID (for organizing in Drive, optional)
        
        Returns:
            Google Drive file_id
        """
        file_metadata = {
            'name': filename,
            'mimeType': 'application/pdf',
            'description': f'Flashcard book uploaded by user {user_id}'
        }
        
        media = MediaIoBaseUpload(
            io.BytesIO(file_data),
            mimetype='application/pdf',
            resumable=True
        )
        
        file = self.service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, size, createdTime'
        ).execute()
        
        return file.get('id')
    
    def download_file(self, file_id: str) -> bytes:
        """Download file from Google Drive"""
        request = self.service.files().get_media(fileId=file_id)
        
        file_buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(file_buffer, request)
        
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        file_buffer.seek(0)
        return file_buffer.read()
    
    def delete_file(self, file_id: str) -> bool:
        """Delete file from Google Drive"""
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_file_info(self, file_id: str) -> dict:
        """Get file metadata from Google Drive"""
        file = self.service.files().get(
            fileId=file_id,
            fields='id, name, size, createdTime, mimeType'
        ).execute()
        
        return {
            'file_id': file.get('id'),
            'file_name': file.get('name'),
            'file_size': int(file.get('size', 0)),
            'created_time': file.get('createdTime'),
            'mime_type': file.get('mimeType')
        }


class AppDriveStorageAdapter(StorageAdapter):
    """
    Storage adapter using a Google Drive service account.
    Central app-managed storage as the default fallback when users
    haven't configured their own Telegram or Google Drive.
    """

    _instance: Optional['AppDriveStorageAdapter'] = None

    def __init__(self, key_file_path: str):
        from google.oauth2 import service_account
        scopes = ['https://www.googleapis.com/auth/drive.file']
        credentials = service_account.Credentials.from_service_account_file(
            key_file_path, scopes=scopes
        )
        self.service = build('drive', 'v3', credentials=credentials)
        self._folder_cache: dict[str, str] = {}

    @classmethod
    def get_instance(cls) -> Optional['AppDriveStorageAdapter']:
        """Singleton: returns None if service account key is not configured."""
        if cls._instance is not None:
            return cls._instance
        key_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY_FILE')
        if not key_path or not os.path.isfile(key_path):
            return None
        cls._instance = cls(key_path)
        return cls._instance

    def _get_or_create_folder(self, folder_name: str, parent_id: Optional[str] = None) -> str:
        cache_key = f"{parent_id}:{folder_name}"
        if cache_key in self._folder_cache:
            return self._folder_cache[cache_key]

        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"

        results = self.service.files().list(q=query, fields='files(id)').execute()
        files = results.get('files', [])

        if files:
            folder_id = files[0]['id']
        else:
            metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder',
            }
            if parent_id:
                metadata['parents'] = [parent_id]
            folder = self.service.files().create(body=metadata, fields='id').execute()
            folder_id = folder['id']

        self._folder_cache[cache_key] = folder_id
        return folder_id

    def upload_file(self, file_data: bytes, filename: str, user_id: str) -> str:
        root_folder = self._get_or_create_folder('flashcard-uploads')
        user_folder = self._get_or_create_folder(f'user-{user_id}', parent_id=root_folder)

        file_metadata = {
            'name': filename,
            'parents': [user_folder],
            'description': f'Flashcard book for user {user_id}',
        }
        media = MediaIoBaseUpload(
            io.BytesIO(file_data), mimetype='application/pdf', resumable=True
        )
        result = self.service.files().create(
            body=file_metadata, media_body=media, fields='id'
        ).execute()
        return result['id']

    def download_file(self, file_id: str) -> bytes:
        request = self.service.files().get_media(fileId=file_id)
        buf = io.BytesIO()
        downloader = MediaIoBaseDownload(buf, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        buf.seek(0)
        return buf.read()

    def delete_file(self, file_id: str) -> bool:
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception:
            return False

    def get_file_info(self, file_id: str) -> dict:
        f = self.service.files().get(
            fileId=file_id, fields='id, name, size, createdTime, mimeType'
        ).execute()
        return {
            'file_id': f.get('id'),
            'file_name': f.get('name'),
            'file_size': int(f.get('size', 0)),
            'created_time': f.get('createdTime'),
            'mime_type': f.get('mimeType'),
        }


def get_storage_adapter(storage_type: str, config: dict) -> StorageAdapter:
    """
    Factory function to get the appropriate storage adapter.

    Args:
        storage_type: 'telegram', 'google_drive', or 'app_drive'
        config: Configuration dict specific to the storage type

    Returns:
        StorageAdapter instance
    """
    if storage_type == 'telegram':
        return TelegramStorageAdapter(bot_token=config['bot_token'])
    elif storage_type == 'google_drive':
        return GoogleDriveStorageAdapter(credentials_dict=config['credentials'])
    elif storage_type == 'app_drive':
        adapter = AppDriveStorageAdapter.get_instance()
        if adapter is None:
            raise ValueError("App Drive storage is not configured (missing GOOGLE_SERVICE_ACCOUNT_KEY_FILE)")
        return adapter
    else:
        raise ValueError(f"Unknown storage type: {storage_type}")

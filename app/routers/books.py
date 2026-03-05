from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io
from .. import schemas, models
from ..database import get_db
from ..models import User, Book
from ..utils.token import get_current_user
from ..utils.storage_adapter import get_storage_adapter, AppDriveStorageAdapter
from ..utils.gemini import get_pdf_page_count

router = APIRouter(prefix="/books", tags=["books"])

MAX_PDF_SIZE_FREE = 10 * 1024 * 1024  # 10 MB for free tier


@router.post("/upload", response_model=schemas.BookResponse)
async def upload_book(
    file: UploadFile = File(...),
    title: str = Form(...),
    target_language: Optional[str] = Form(None),
    native_language: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """
    Upload a PDF book to the user's configured storage (Telegram or Google Drive).
    Enforces quota limits based on subscription tier.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # Validate file size against tier limit
    if file_size > current_user.max_storage_bytes:
        max_mb = current_user.max_storage_bytes / 1024 / 1024
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size for your tier is {max_mb:.0f} MB"
        )

    # Check quota: file count
    if current_user.file_count >= current_user.max_files:
        raise HTTPException(
            status_code=400,
            detail=f"File limit reached ({current_user.max_files} files). Delete some files or upgrade your plan."
        )

    # Check quota: storage space
    if current_user.storage_used_bytes + file_size > current_user.max_storage_bytes:
        remaining_mb = (current_user.max_storage_bytes - current_user.storage_used_bytes) / 1024 / 1024
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient storage space. You have {remaining_mb:.2f} MB remaining."
        )

    try:
        # Get PDF page count
        total_pages = get_pdf_page_count(file_bytes)

        # Determine storage: user-configured or app-managed fallback
        user_has_storage = (
            current_user.storage_config
            and current_user.storage_config.storage_type
            and (current_user.storage_config.telegram_bot_token or current_user.storage_config.google_credentials)
        )

        if user_has_storage:
            storage_type = current_user.storage_config.storage_type
            if storage_type == 'telegram':
                adapter = get_storage_adapter('telegram', {
                    'bot_token': current_user.storage_config.telegram_bot_token
                })
                file_id = adapter.upload_file(
                    file_bytes, file.filename,
                    current_user.storage_config.telegram_user_id
                )
            elif storage_type == 'google_drive':
                adapter = get_storage_adapter('google_drive', {
                    'credentials': current_user.storage_config.google_credentials
                })
                file_id = adapter.upload_file(
                    file_bytes, file.filename, str(current_user.id)
                )
            else:
                raise HTTPException(status_code=500, detail=f"Unsupported storage type: {storage_type}")
        else:
            # Fallback: app-managed Google Drive via service account
            app_adapter = AppDriveStorageAdapter.get_instance()
            if app_adapter is None:
                raise HTTPException(
                    status_code=400,
                    detail="No storage available. Please configure Telegram or Google Drive in Settings."
                )
            storage_type = 'app_drive'
            file_id = app_adapter.upload_file(
                file_bytes, file.filename, str(current_user.id)
            )
        
        # Create book record
        book = Book(
            title=title,
            filename=file.filename,
            file_size_bytes=file_size,
            total_pages=total_pages,
            storage_file_id=file_id,
            storage_type=storage_type,
            target_language=target_language,
            native_language=native_language,
            owner=current_user,
        )
        book.save(using=db)
        
        # Update user quota
        current_user.storage_used_bytes += file_size
        current_user.file_count += 1
        current_user.save(using=db)
        
        # Auto-create progress tracker
        from ..models import BookProgress
        progress = BookProgress(book=book, owner=current_user)
        progress.save(using=db)
        
        return schemas.BookResponse(
            id=str(book.id),
            title=book.title,
            filename=book.filename,
            total_pages=book.total_pages,
            chapters=[],
            target_language=book.target_language,
            native_language=book.native_language,
            date_created=book.date_created,
            last_edited=book.last_edited,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/", response_model=List[schemas.BookResponse])
def list_books(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """List all books owned by the current user"""
    books = Book.objects(owner=current_user).skip(skip).limit(limit).using(db)
    return [
        schemas.BookResponse(
            id=str(book.id),
            title=book.title,
            filename=book.filename,
            total_pages=book.total_pages,
            chapters=[schemas.ChapterSchema(**c.to_mongo().to_dict()) for c in (book.chapters or [])],
            target_language=book.target_language,
            native_language=book.native_language,
            date_created=book.date_created,
            last_edited=book.last_edited,
        )
        for book in books
    ]


@router.get("/{book_id}", response_model=schemas.BookResponse)
def get_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """Get a specific book by ID"""
    from bson import ObjectId
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return schemas.BookResponse(
        id=str(book.id),
        title=book.title,
        filename=book.filename,
        total_pages=book.total_pages,
        chapters=[schemas.ChapterSchema(**c.to_mongo().to_dict()) for c in (book.chapters or [])],
        target_language=book.target_language,
        native_language=book.native_language,
        date_created=book.date_created,
        last_edited=book.last_edited,
    )


@router.get("/{book_id}/download")
async def download_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """
    Download a book PDF file from the user's configured storage.
    """
    from bson import ObjectId
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    try:
        # Handle legacy GridFS files
        if book.storage_type == 'gridfs' or (book.file and not book.storage_file_id):
            file_data = book.file.read()
        else:
            storage_type = book.storage_type
            if storage_type == 'telegram':
                adapter = get_storage_adapter('telegram', {
                    'bot_token': current_user.storage_config.telegram_bot_token
                })
            elif storage_type == 'google_drive':
                adapter = get_storage_adapter('google_drive', {
                    'credentials': current_user.storage_config.google_credentials
                })
            elif storage_type == 'app_drive':
                adapter = get_storage_adapter('app_drive', {})
            else:
                raise HTTPException(status_code=500, detail=f"Unsupported storage type: {storage_type}")

            file_data = adapter.download_file(book.storage_file_id)

        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={book.filename}"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.put("/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: str,
    book_update: schemas.BookUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """Update book metadata (title, languages, chapters)"""
    from bson import ObjectId
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update fields
    if book_update.title is not None:
        book.title = book_update.title
    if book_update.target_language is not None:
        book.target_language = book_update.target_language
    if book_update.native_language is not None:
        book.native_language = book_update.native_language
    if book_update.chapters is not None:
        from ..models import Chapter
        book.chapters = [
            Chapter(name=c.name, start_page=c.start_page, end_page=c.end_page)
            for c in book_update.chapters
        ]
    
    book.save(using=db)
    
    return schemas.BookResponse(
        id=str(book.id),
        title=book.title,
        filename=book.filename,
        total_pages=book.total_pages,
        chapters=[schemas.ChapterSchema(**c.to_mongo().to_dict()) for c in (book.chapters or [])],
        target_language=book.target_language,
        native_language=book.native_language,
        date_created=book.date_created,
        last_edited=book.last_edited,
    )


@router.delete("/{book_id}")
async def delete_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """
    Delete a book and its associated file from storage.
    Updates user's storage quota.
    """
    from bson import ObjectId
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    file_size = book.file_size_bytes or 0
    
    try:
        # Delete from storage
        if book.storage_type == 'gridfs' or (book.file and not book.storage_file_id):
            pass  # Legacy GridFS - file deleted with book document
        elif book.storage_file_id:
            storage_type = book.storage_type
            if storage_type == 'telegram':
                adapter = get_storage_adapter('telegram', {
                    'bot_token': current_user.storage_config.telegram_bot_token
                })
            elif storage_type == 'google_drive':
                adapter = get_storage_adapter('google_drive', {
                    'credentials': current_user.storage_config.google_credentials
                })
            elif storage_type == 'app_drive':
                adapter = get_storage_adapter('app_drive', {})
            else:
                adapter = None
            if adapter:
                adapter.delete_file(book.storage_file_id)

        # Delete book record (cascades to progress, draft cards, etc.)
        book.delete(using=db)

        # Update user quota
        if file_size > 0:
            current_user.storage_used_bytes = max(0, current_user.storage_used_bytes - file_size)
            current_user.file_count = max(0, current_user.file_count - 1)
            current_user.save(using=db)

        return {"detail": "Book and associated data deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


# Progress endpoints remain the same
@router.get("/{book_id}/progress", response_model=schemas.BookProgressResponse)
def get_progress(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """Get or create progress tracker for a book"""
    from bson import ObjectId
    from ..models import BookProgress
    
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    progress = BookProgress.objects(book=book, owner=current_user).using(db).first()
    if not progress:
        progress = BookProgress(book=book, owner=current_user)
        progress.save(using=db)
    
    return schemas.BookProgressResponse(
        id=str(progress.id),
        book_id=str(book.id),
        current_page=progress.current_page,
        current_chapter=progress.current_chapter,
        pages_processed=[
            schemas.PageRangeSchema(start=p.start, end=p.end) for p in (progress.pages_processed or [])
        ],
        chapters_completed=progress.chapters_completed or [],
        date_created=progress.date_created,
        last_edited=progress.last_edited,
    )


@router.put("/{book_id}/progress", response_model=schemas.BookProgressResponse)
def update_progress(
    book_id: str,
    progress_update: schemas.BookProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: str = Depends(get_db),
):
    """Update progress tracker for a book"""
    from bson import ObjectId
    from ..models import BookProgress
    
    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    progress = BookProgress.objects(book=book, owner=current_user).using(db).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    if progress_update.current_page is not None:
        progress.current_page = progress_update.current_page
    if progress_update.current_chapter is not None:
        progress.current_chapter = progress_update.current_chapter
    
    progress.save(using=db)
    
    return schemas.BookProgressResponse(
        id=str(progress.id),
        book_id=str(book.id),
        current_page=progress.current_page,
        current_chapter=progress.current_chapter,
        pages_processed=[
            schemas.PageRangeSchema(start=p.start, end=p.end) for p in (progress.pages_processed or [])
        ],
        chapters_completed=progress.chapters_completed or [],
        date_created=progress.date_created,
        last_edited=progress.last_edited,
    )

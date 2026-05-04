from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io
from .. import schemas, models
from ..database import get_db
from ..models import User, Book
from ..utils.token import get_current_user
from ..utils.gemini import get_pdf_page_count

router = APIRouter(prefix="/books", tags=["books"])

MAX_PDF_SIZE_FREE = 10 * 1024 * 1024  # 10 MB for free tier


@router.get("/", response_model=list[schemas.BookResponse])
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
    from bson import ObjectId
    from ..models import BookProgress, DraftCard

    book = Book.objects(id=ObjectId(book_id), owner=current_user).using(db).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        if book.file:
            book.file.delete()

        BookProgress.objects(book=book, owner=current_user).using(db).delete()
        DraftCard.objects(book=book, owner=current_user).using(db).delete()
        book.delete(using=db)

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

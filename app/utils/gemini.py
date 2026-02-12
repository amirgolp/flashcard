import os
import io
from typing import List, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from PyPDF2 import PdfReader, PdfWriter
from dotenv import load_dotenv
from .logger import logger

load_dotenv(dotenv_path="app/.env")


# Pydantic models for Gemini structured response
class GeminiExampleSentence(BaseModel):
    sentence: str
    translation: str


class GeminiFlashcard(BaseModel):
    front: str
    back: str
    examples: List[GeminiExampleSentence]
    synonyms: List[str]
    antonyms: List[str]
    part_of_speech: str
    gender: Optional[str] = None
    plural_form: Optional[str] = None
    pronunciation: Optional[str] = None
    notes: Optional[str] = None


class GeminiGenerationResult(BaseModel):
    flashcards: List[GeminiFlashcard]


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


def _get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def extract_page_range_as_pdf(pdf_bytes: bytes, start_page: int, end_page: int) -> bytes:
    """Read full PDF bytes, extract a page range, return as new PDF bytes.

    Pages are 1-indexed (start_page=1 means the first page).
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    for page_num in range(start_page - 1, min(end_page, len(reader.pages))):
        writer.add_page(reader.pages[page_num])

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return len(reader.pages)


def generate_flashcards_from_pdf(
    pdf_bytes: bytes,
    num_cards: int = 10,
    target_language: str = "the target language",
    native_language: str = "English",
) -> GeminiGenerationResult:
    """Send PDF page(s) to Gemini and return structured flashcard data."""
    client = _get_client()
    model = _get_model()

    prompt = f"""You are a language learning assistant. Analyze the following PDF pages
from a {target_language} language learning textbook.

Extract approximately {num_cards} vocabulary words or phrases that would make good
flashcards for a student learning {target_language}.

For each word/phrase, provide:
- front: the word/phrase in {target_language}
- back: translation to {native_language}
- examples: exactly 3 example sentences using the word in {target_language}, each with
  its {native_language} translation
- synonyms: up to 3 synonyms in {target_language} (empty list if none applicable)
- antonyms: up to 3 antonyms in {target_language} (empty list if none applicable)
- part_of_speech: the grammatical category (noun, verb, adjective, adverb, etc.)
- gender: grammatical gender if applicable to {target_language} (null if not applicable)
- plural_form: the plural form if applicable (null if not applicable)
- pronunciation: IPA pronunciation or phonetic guide
- notes: any important usage notes, irregular forms, or cultural context

Focus on the most useful and pedagogically valuable vocabulary from these pages."""

    response = client.models.generate_content(
        model=model,
        contents=[
            types.Part.from_bytes(
                data=pdf_bytes,
                mime_type="application/pdf",
            ),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiGenerationResult,
            temperature=0.3,
        ),
    )

    result = GeminiGenerationResult.model_validate_json(response.text)
    logger.info(f"Gemini generated {len(result.flashcards)} flashcards")
    return result

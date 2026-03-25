import os
import io
from typing import List, Optional
from pydantic import BaseModel, create_model
from google import genai
from google.genai import types
from PyPDF2 import PdfReader, PdfWriter
from dotenv import load_dotenv
from .logger import logger

# Loading environment variables
load_dotenv(dotenv_path="app/.env")


# Pydantic models for Gemini structured response
# This defines the structure of one flashcard.
# Because it inherits from BaseModel, Pydantic will validate data against this schema.
#Why use a Pydantic model here?

# Because LLM output can be messy.
# Pydantic helps ensure:
# required fields exist
# values have expected types
# the output is easier to work with later in code
# Without this, you’d be manually checking raw JSON all over the place.
class GeminiFlashcard(BaseModel):
    front: str
    back: str
    # Simplify examples to a list of dicts or strings if needed, 
    # but let's try keeping it simple first. 
    # The error suggests it can't find the definition for the nested type.
    # We'll define the nested structure explicitly in the prompt or use a simpler structure.
    # tailored for the specific library version issue.
    # Let's try defining the inner class *inside* or just using standard types if possible,
    # or ensuring the naming doesn't conflict. 
    # Actually, the safest bet with this specific error is often to flatten or use dicts.
    examples: list[dict] # [{"sentence": "...", "translation": "..."}]
    synonyms: list[str]
    antonyms: list[str]
    part_of_speech: str
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None

#This defines the overall response structure.
#So GeminiGenerationResult is a wrapper object containing a list of flashcards.
class GeminiGenerationResult(BaseModel):
    flashcards: list[GeminiFlashcard]

# A client object is just a Python object that knows how to talk to some external service.
# Gemini API = the actual service on Google’s side
# client object = your program’s “remote control” for that service
# So instead of manually building HTTP requests, headers, authentication, JSON payloads, and parsing responses, the client object does that work for you.
def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    #if the key is not properly set, the program fails early with a clear message.
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)

#This returns the model name.
# use GEMINI_MODEL from environment if available
# otherwise default to "gemini-2.5-flash"
def _get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# This function takes a PDF in bytes form and returns a smaller PDF containing only a selected page range.
# pdf_bytes as a pile of paper pages dumped on a table.
# They contain the information, but they are not inside a binder or folder.
# io.BytesIO(pdf_bytes) is like putting those pages into a folder with tabs so another tool can flip through them properly.
def extract_page_range_as_pdf(pdf_bytes: bytes, start_page: int, end_page: int) -> bytes:
    """Read full PDF bytes, extract a page range, return as new PDF bytes.

    Pages are 1-indexed (start_page=1 means the first page).
    """
    #Turn PDF bytes into an in-memory file, then read it as a PDF.
    # An in-memory file is a file-like object that lives in RAM instead of on disk.
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    for page_num in range(start_page - 1, min(end_page, len(reader.pages))):
        writer.add_page(reader.pages[page_num])
    # It wraps raw bytes in an object that behaves like a file.
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
    template=None,
):
    """Send PDF page(s) to Gemini and return structured flashcard data."""
    client = _get_client()
    model = _get_model()

    # This means the user wants custom flashcards.
    # Instead of always returning fields like front, back, examples, etc., the function will look at template.fields and build the schema dynamically.
    if template:
        prompt = f"You are a content extraction assistant. Analyze the following PDF pages.\n\n"
        prompt += f"Extract approximately {num_cards} flashcards based on the provided material.\n\n"
        prompt += f"{template.system_prompt or ''}\n\n"
        prompt += "For each flashcard, provide the following fields:\n"
        
        for field in template.fields:
            prompt += f"- {field.name}: {field.description}\n"
            
        prompt += "\nFocus on extracting high-quality, relevant content."

        # Build dynamic pydantic schema
        # This dictionary will store the field definitions for a Pydantic model.
        fields = {}
        for f in template.fields:
            if f.type == "list":
                fields[f.name] = (list[str] if f.required else list[str] | None, ...)
            # So non-list fields are treated as strings.
            else:
                fields[f.name] = (str if f.required else str | None, ...)
        # manually, Python builds it for you based on the template
        # fields is a dictionary that will hold all the fields needed to build the dynamic model.        
        DynamicFlashcard = create_model("DynamicFlashcard", **fields)
        response_schema = create_model("DynamicGenerationResult", flashcards=(list[DynamicFlashcard], ...))
        # So Gemini’s final output must look like:
        # {
        # "flashcards": [
        #     { ... one dynamic flashcard ... },
        #     { ... another dynamic flashcard ... }
        # ]
        # }

    #This runs when no template is provided.   
    else:
        prompt = f"""You are a language learning assistant. Analyze the following PDF pages
from a {target_language} language learning textbook.

Extract approximately {num_cards} vocabulary words or phrases that would make good
flashcards for a student learning {target_language}.

For each word/phrase, provide:
- front: the word/phrase in {target_language}
- back: translation to {native_language}
- examples: exactly 3 example sentences using the word in {target_language}, each with
  its {native_language} translation. Format as a list of objects like: [{{"sentence": "...", "translation": "..."}}]
- synonyms: up to 3 synonyms in {target_language} (empty list if none applicable)
- antonyms: up to 3 antonyms in {target_language} (empty list if none applicable)
- part_of_speech: the grammatical category (noun, verb, adjective, adverb, etc.)
- gender: grammatical gender if applicable to {target_language} (null if not applicable)
- plural_form: the plural form if applicable (null if not applicable)
- pronunciation: IPA pronunciation or phonetic guide
- notes: any important usage notes, irregular forms, or cultural context

Focus on the most useful and pedagogically valuable vocabulary from these pages."""
        # It is storing the actual model class in a variable.
        response_schema = GeminiGenerationResult
    # Temperature controls randomness.
    # lower = more predictable and consistent
    # higher = more creative and varied
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
            response_schema=response_schema,
            temperature=0.3,
        ),
    )
 

    # Because we asked for JSON, this should be a JSON string.
    # Something like:

    # {
    # "flashcards": [
    #     {
    #     "front": "Haus",
    #     "back": "house",
    #     "examples": [
    #         {"sentence": "Das Haus ist groß.", "translation": "The house is big."}
    #     ],
    #     "synonyms": ["Wohnhaus"],
    #     "antonyms": [],
    #     "part_of_speech": "noun",
    #     "gender": "neuter",
    #     "plural_form": "Häuser",
    #     "pronunciation": "haʊ̯s",
    #     "notes": null
    #     }
    # ]
    # }
    #model_validate_json(...)?
    # It does two jobs:
    # 1. Parse JSON
    # It turns JSON text into Python data.
    # 2. Validate structure
    # It checks whether the JSON matches the schema.
    # So if the response is wrong, Pydantic raises an error.
    # If the response is correct, you get a proper Pydantic model object.
    result = response_schema.model_validate_json(response.text)
    logger.info(f"Gemini generated {len(result.flashcards)} flashcards")
    return result

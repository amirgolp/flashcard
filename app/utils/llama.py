import requests
import os
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
    "X-OpenRouter-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  extra_body={},
  model="meta-llama/llama-3.3-70b-instruct:free",
  messages=[
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
)
print(completion.choices[0].message.content)



import os
import io
import json
import base64
from typing import Optional

import requests
from pydantic import BaseModel, create_model
from PyPDF2 import PdfReader, PdfWriter
from dotenv import load_dotenv

from .logger import logger

# Loading environment variables
load_dotenv(dotenv_path="app/.env")


# ----------------------------
# Pydantic models
# ----------------------------

class ExampleItem(BaseModel):
    sentence: str
    translation: str


class LlamaFlashcard(BaseModel):
    front: str
    back: str
    examples: list[ExampleItem]
    synonyms: list[str]
    antonyms: list[str]
    part_of_speech: str
    gender: str | None = None
    plural_form: str | None = None
    pronunciation: str | None = None
    notes: str | None = None


class LlamaGenerationResult(BaseModel):
    flashcards: list[LlamaFlashcard]


# ----------------------------
# Config helpers
# ----------------------------

def _get_openrouter_llama_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "your_openrouter_api_key_here":
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    return api_key


def _get_model() -> str:
    # Example Llama model on OpenRouter:
    # "meta-llama/llama-3.3-70b-instruct"
    return os.getenv("LLAMA_MODEL", "meta-llama/llama-3.3-70b-instruct:free")


def _get_openrouter_base_url() -> str:
    return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


# ----------------------------
# PDF helpers
# ----------------------------

def extract_page_range_as_pdf(pdf_bytes: bytes, start_page: int, end_page: int) -> bytes:
    """Read full PDF bytes, extract a page range, return as new PDF bytes.

    Pages are 1-indexed (start_page=1 means the first page).
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)

    if start_page < 1 or end_page < start_page:
        raise ValueError("Invalid page range")

    writer = PdfWriter()
    for page_num in range(start_page - 1, min(end_page, total_pages)):
        writer.add_page(reader.pages[page_num])

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return len(reader.pages)


def pdf_bytes_to_data_url(pdf_bytes: bytes) -> str:
    encoded = base64.b64encode(pdf_bytes).decode("utf-8")
    return f"data:application/pdf;base64,{encoded}"


# ----------------------------
# JSON schema helper
# ----------------------------

def pydantic_to_openrouter_response_format(schema_model: type[BaseModel], schema_name: str = "flashcards_response") -> dict:
    """
    Convert a Pydantic model into OpenRouter/OpenAI-style json_schema response_format.
    """
    schema = schema_model.model_json_schema()

    return {
        "type": "json_schema",
        "json_schema": {
            "name": schema_name,
            "strict": True,
            "schema": schema,
        },
    }


# ----------------------------
# Main generation function
# ----------------------------

def generate_flashcards_from_pdf(
    pdf_bytes: bytes,
    num_cards: int = 10,
    target_language: str = "the target language",
    native_language: str = "English",
    template=None,
):
    """Send PDF page(s) to a Llama model on OpenRouter and return structured flashcard data."""
    api_key = _get_openrouter_llama_api_key()
    model = _get_model()
    base_url = _get_openrouter_base_url()

    # Build prompt + schema
    if template:
        prompt = "You are a content extraction assistant. Analyze the attached PDF pages.\n\n"
        prompt += f"Extract approximately {num_cards} flashcards based on the provided material.\n\n"
        prompt += f"{template.system_prompt or ''}\n\n"
        prompt += "For each flashcard, provide the following fields:\n"

        fields = {}
        for f in template.fields:
            prompt += f"- {f.name}: {f.description}\n"

            if f.type == "list":
                fields[f.name] = (list[str], ...) if f.required else (list[str] | None, None)
            else:
                fields[f.name] = (str, ...) if f.required else (str | None, None)

        prompt += "\nFocus on extracting high-quality, relevant content."
        prompt += "\nReturn only valid JSON matching the provided schema."

        DynamicFlashcard = create_model("DynamicFlashcard", **fields)
        response_schema = create_model(
            "DynamicGenerationResult",
            flashcards=(list[DynamicFlashcard], ...)
        )

    else:
        prompt = f"""You are a language learning assistant. Analyze the attached PDF pages
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

Focus on the most useful and pedagogically valuable vocabulary from these pages.
Return only valid JSON matching the provided schema.
"""
        response_schema = LlamaGenerationResult

    response_format = pydantic_to_openrouter_response_format(
        response_schema,
        schema_name="flashcards_response"
    )

    pdf_data_url = pdf_bytes_to_data_url(pdf_bytes)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # Optional but recommended by OpenRouter
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:8000"),
        "X-Title": os.getenv("OPENROUTER_APP_NAME", "flashcard-generator"),
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "file",
                        "file": {
                            "filename": "document.pdf",
                            "file_data": pdf_data_url,
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        "response_format": response_format,
        "temperature": 0.3,
    }

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
    except requests.RequestException as e:
        logger.exception("OpenRouter API call failed")
        raise RuntimeError("Failed to generate content from OpenRouter") from e

    data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        logger.exception("Unexpected OpenRouter response shape: %s", data)
        raise ValueError("OpenRouter returned an unexpected response format") from e

    if not content:
        raise ValueError("OpenRouter returned an empty response")

    try:
        result = response_schema.model_validate_json(content)
    except Exception as e:
        logger.exception("Failed to validate OpenRouter response: %s", content)
        raise ValueError("OpenRouter returned invalid structured output") from e

    logger.info(f"OpenRouter generated {len(result.flashcards)} flashcards")
    return result
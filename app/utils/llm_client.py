import os
import io
import json
from typing import List, Optional
from pydantic import BaseModel, create_model
from google import genai
from google.genai import types
from PyPDF2 import PdfReader, PdfWriter
from dotenv import load_dotenv
from .logger import logger
from abc import ABC, abstractmethod

load_dotenv(dotenv_path="app/.env")


# Pydantic models for LLM structured response
class LLMFlashcard(BaseModel):
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


class LLMGenerationResult(BaseModel):
    flashcards: list[LLMFlashcard]



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


def _build_prompt( target_language: str,
                  native_language: str = "English",
                  num_cards: int = 10,
                  template=None,
                  ) -> tuple[str, type[BaseModel]]:
    """Build a prompt for Gemini and return the prompt and response schema."""
    if template:
        prompt = f"You are a content extraction assistant.\n\n"
        prompt += f"Extract approximately {num_cards} flashcards based on the provided material.\n\n"
        prompt += f"{template.system_prompt or ''}\n\n"
        prompt += "For each flashcard, provide the following fields:\n"
        
        for field in template.fields:
            prompt += f"- {field.name}: {field.description}\n"
            
        prompt += "\nFocus on extracting high-quality, relevant content."

        # Build dynamic pydantic schema
        fields = {}
        for f in template.fields:
            if f.type == "list":
                fields[f.name] = (list[str] if f.required else list[str] | None, ...)
            else:
                fields[f.name] = (str if f.required else str | None, ...)
                
        DynamicFlashcard = create_model("DynamicFlashcard", **fields)
        response_schema = create_model("DynamicGenerationResult", flashcards=(list[DynamicFlashcard], ...))
        return prompt, response_schema
        
    else:
        prompt = f"""You are a language learning assistant.

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
        return prompt, LLMGenerationResult


#contract for LLM providers
class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_from_pdf(self, pdf_bytes: bytes, num_cards: int, target_language: str, native_language: str, template=None):
        ...

    @abstractmethod
    def generate_from_image(self, image_bytes: bytes, mime_type: str, num_cards: int, target_language: str, native_language: str, template=None):
        ...

    @abstractmethod
    def generate_from_images(self, images: list[tuple[bytes, str]], num_cards: int, target_language: str, native_language: str, template=None):
        ...



class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        from google import genai
        from google.genai import types
        self.genai = genai
        self.types = types
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client =self.genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def _call(self, parts:list, prompt:str, response_schema: type[BaseModel]):
        response = self.client.models.generate_content(
            model=self.model,
            contents=parts+[prompt],
            config=self.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.3,
            )
        )
        return response_schema.model_validate_json(response.text)
    
    def generate_from_pdf(self, pdf_bytes: bytes, 
                          num_cards: int, 
                          target_language: str,
                          native_language: str="English", 
                          template=None):
        prompt, response_schema =_build_prompt(num_cards=num_cards,
                                               target_language=target_language,
                                               native_language=native_language,
                                               template=template)
        # each part is one piece of input (text, image, or PDF). 
        # Think of it like sending an email with attachments: each attachment is a "part".
        parts =[self.types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")]
        return self._call(parts, prompt, response_schema)
    
    def generate_from_image(self, image_bytes: bytes,
                            mime_type: str,
                            num_cards: int,
                            target_language: str,
                            native_language: str="English",
                            template=None):
        prompt, response_schema =_build_prompt(num_cards=num_cards,
                                               target_language=target_language,
                                               native_language=native_language,
                                               template=template,
                                               )
        parts =[self.types.Part.from_bytes(data=image_bytes, mime_type=mime_type)]
        return self._call(parts, prompt, response_schema)
    
    def generate_from_images(self, images: list[tuple[bytes, str]],
                             num_cards: int, 
                             target_language: str,
                             native_language: str="English",
                             template=None,
                             ):
        prompt, response_schema =_build_prompt(num_cards=num_cards,
                                               target_language=target_language,
                                               native_language=native_language,
                                               template=template)
        parts =[self.types.Part.from_bytes(data=img_bytes, mime_type=mime_type) for img_bytes, mime_type in images]
        return self._call(parts, prompt, response_schema)
    

class GroqProvider(BaseLLMProvider):
    def __init__(self):
        from groq import Groq
        groq_api_key=os.getenv("GROQ_API_KEY")
        if not groq_api_key or groq_api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self.client = Groq(api_key=groq_api_key)
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")

    def _chat_json(self, prompt:str) -> dict:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content)

    def _run(self, input_hint: str,
             num_cards:int,
             target_language: str,
             native_language: str="English",
             template=None):
        prompt, response_schema =_build_prompt(num_cards=num_cards,
                                               target_language=target_language,
                                               native_language=native_language,
                                               template=template)
        full_prompt =f"{prompt}\n\nInput summary:\n{input_hint}\n"
        data= self._chat_json(full_prompt)
        return response_schema.model_validate(data)

    
    def generate_from_pdf(self, pdf_bytes: bytes,
                          num_cards: int,
                          target_language: str,
                          native_language: str="English",
                          template=None):
        return self._run("PDF bytes were provided by server.",
                         num_cards=num_cards,
                         target_language=target_language,
                         native_language=native_language,
                         template=template)

    def generate_from_image(self, image_bytes: bytes,
                            mime_type: str,
                            num_cards: int,
                            target_language: str,
                            native_language: str="English",
                            template=None):
        return self._run(f"Image bytes were provided by server (MIME type: {mime_type}).",
                         num_cards=num_cards,
                         target_language=target_language,
                         native_language=native_language,
                         template=template)
    
    def generate_from_images(self, images: list[tuple[bytes, str]],
                             num_cards:int,
                             target_language:str,
                             native_language:str="English",
                             template=None):
        
        return self._run(f"{len(images)} image bytes were provided by server.",
                         num_cards=num_cards,
                         target_language=target_language,
                         native_language=native_language,
                         template=template)
    

class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model=os.getenv("OLLAMA_MODEL", "llama2")

    def _chat_json(self,prompt:str) -> dict:
        import requests
        url = f"{self.base_url}/api/chat"
        payload ={
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json"
        }
        req=requests.post(url, json=payload)
        req.raise_for_status()
        content=req.json()["messages"]["content"]
        return json.loads(content)
    
    def _run(self, input_hint: str,
             num_cards: int,
             target_language: str,
             native_language: str,
             template=None
             ):
        prompt,schema=_build_prompt(num_cards,
                                    target_language,
                                    native_language,
                                    template
                                    )
        data=self._chat_json(f"{prompt}\n\nInput summary: \n{input_hint}")
        return schema.model_validate(data)
    
    def generate_from_pdf(self, pdf_bytes, 
                          num_cards, 
                          target_language, 
                          native_language, 
                          template=None):
        return self._run("PDF bytes were provided by server.", 
                         num_cards,
                         target_language,
                         native_language,
                         template)
    
    def generate_from_image(self, image_bytes: bytes, 
                            mime_type: str, 
                            num_cards: int, 
                            target_language: str, 
                            native_language: str, 
                            template=None):
        return self._run(f"Single image provided. mime={mime_type}", 
                         num_cards, 
                         target_language, 
                         native_language, 
                         template)

    def generate_from_images(self, 
                             images: list[tuple[bytes, str]], 
                             num_cards: int, 
                             target_language: str, 
                             native_language: str, 
                             template=None):
        return self._run(f"{len(images)} images provided.", 
                         num_cards, 
                         target_language, 
                         native_language, 
                         template)
    
class LLMClient:
    def __init__(self, provider_name:str):
        if provider_name == "gemini":
            self.provider = GeminiProvider()
        elif provider_name == "groq":
            self.provider = GroqProvider()
        elif provider_name == "ollama":
            self.provider = OllamaProvider()
        else:
            raise ValueError(f"Unsupported LLM provider: {provider_name}")
        
        logger.info(f"LLMClient initialized with provider: {provider_name}")

    def generate_from_pdf(self,**kwargs):
        return self.provider.generate_from_pdf(**kwargs)
    
    def generate_from_image(self,**kwargs):
        return self.provider.generate_from_image(**kwargs)
    
    def generate_from_images(self,**kwargs):
        return self.provider.generate_from_images(**kwargs)
    
_client_singleton: LLMClient | None = None
@staticmethod
def get_llm_client(provider_name:str) -> LLMClient:
    global _client_singleton
    if _client_singleton is None:
        _client_singleton = LLMClient(provider_name)
    return _client_singleton
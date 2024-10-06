import os
from dotenv import load_dotenv
from pydantic import Field
from pydantic.v1 import BaseSettings

ENV = os.getenv("ENV", "development")

if ENV == "test":
    load_dotenv(dotenv_path="back/.env.test")
else:
    load_dotenv(dotenv_path="back/.env")


class Settings(BaseSettings):
    MONGODB_URI: str = Field(..., alias="MONGODB_URI")
    DATABASE_NAME: str = Field("flashcard_db", alias="DATABASE_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

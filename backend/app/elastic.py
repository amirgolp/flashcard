from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError
import os

from backend.app.utils import default_es_host, default_es_index, env_path

if not os.getenv("ELASTIC_HOST"):
    load_dotenv(env_path)
ES_HOST = os.getenv("ELASTIC_HOST", default_es_host)
ES_INDEX = default_es_index

es = Elasticsearch(ES_HOST)


def create_index():
    if not es.indices.exists(index=ES_INDEX):
        es.indices.create(
            index=ES_INDEX,
            body={
                "mappings": {
                    "properties": {
                        "german": {"type": "text"},
                        "english": {"type": "text"},
                    }
                }
            },
        )


def index_flashcard(flashcard):
    es.index(
        index=ES_INDEX,
        id=str(flashcard.id),
        body={"german": flashcard.german, "english": flashcard.english},
    )


def delete_flashcard_from_index(flashcard_id):
    try:
        es.delete(index=ES_INDEX, id=flashcard_id)
    except NotFoundError:
        pass


def search_flashcards(query):
    response = es.search(
        index=ES_INDEX,
        body={
            "query": {"multi_match": {"query": query, "fields": ["german", "english"]}}
        },
    )
    return [hit["_id"] for hit in response["hits"]["hits"]]

import click
from app.database import connect_db
from app.elastic import create_index
from app.models import Flashcard

@click.group()
def cli():
    """Flashcard App CLI"""
    pass

@cli.command()
def init_db():
    """Initialize the database and Elasticsearch index."""
    try:
        connect_db()
        create_index()
        click.echo("Database and Elasticsearch index initialized successfully.")
    except Exception as e:
        click.echo(f"Error initializing database: {e}")

@cli.command()
def list_flashcards():
    """List all flashcards."""
    try:
        connect_db()
        flashcards = Flashcard.objects.all()
        for fc in flashcards:
            click.echo(f"{fc.id}: {fc.german} - {fc.english}")
    except Exception as e:
        click.echo(f"Error listing flashcards: {e}")

if __name__ == "__main__":
    cli()
# Flashcard App

A full-stack flashcard learning application built with FastAPI (Python), MongoDB, and React with TypeScript, Vite, and Material-UI.

## 🚀 How to Run the Project

### 1. Backend (FastAPI + MongoDB)
The backend is located in the `app` directory.

**Prerequisites**: Python 3.9+ and MongoDB Atlas (or a local MongoDB instance).

1. **Environment Variables**:
   Copy the example environment file inside the `app` directory to set up your credentials:
   ```bash
   cp app/.env.example app/.env
   ```
   Configure your MongoDB connection inside `app/.env`:
   - `LOCAL_MONGODB_URI` (Defaults to a local connection: `mongodb://admin:secretpassword@localhost:27017/flashcard_db?authSource=admin`)
   - `MONGODB_HOST` (Set this to your MongoDB Atlas connection string for a cloud fallback)
   
   **Running MongoDB Locally**:
   The backend is configured to prioritize `LOCAL_MONGODB_URI`. If you want to run a local database, simply start the included Docker container:
   ```bash
   docker-compose up -d
   ```
   If the local container isn't running or the connection fails, the backend will automatically fallback to the cloud `MONGODB_HOST`.

   **Other Integrations:**
   - **Google Drive Storage**: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for file storage.
   - **AI Generation (Gemini)**: Add `GEMINI_API_KEY` to use the Gemini model for content generation.

2. **Install dependencies**:
   This project uses `uv` for fast package management. The dependencies are defined in `pyproject.toml` and locked/resolved in `requirements.txt`.
   
   If you have `uv` installed:
   ```bash
   uv sync
   # or
   uv pip install -r requirements.txt
   ```
   *Fallback (using pip):*
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the API Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Alternatively, if using `poe`:*
   ```bash
   poe api
   ```
The backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend (React + Vite)
The frontend is located in the `gui` directory.

**Prerequisites**: Node.js 18+ and npm.

1. **Navigate to the frontend directory**:
   ```bash
   cd gui
   ```

2. **Environment Variables**:
   Copy the example environment file inside the `gui` directory:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` is set to the backend API address (e.g., `http://localhost:8000`).

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   *Alternatively, using `poe` from the root directory:*
   ```bash
   poe gui
   ```

---

## ✨ Implemented Features

### Backend Architecture
- **Authentication**: Secure JWT-based user authentication and password hashing with bcrypt.
- **Decks & Cards Management**: Complete CRUD operations for organizing flashcard decks and individual flashcards, fully restricted by user ownership.
- **Full-Text Search**: Weighted text indexes on flashcards (front, back, examples) enabling extensive search capabilities.
- **Storage Integrations**: Uses **Google Drive** for secure cloud file storage and backups.
- **Extensible Architecture**: Includes modules ready for generative AI (`generation.py`), external literary integration (`books.py`), and storage backups (`storage.py`).
- **AI Generation**: Integrates the **Gemini Model** for AI-powered content and flashcard generation (`generation.py`), alongside external module integration (e.g., `books.py`).
- **Telegram Integration (Under Development)**: allowing users to integrate Telegram to manage their file storage directly within chats.

### Frontend Experience
- **Modern User Interface**: Built leveraging React 18 and Material-UI (MUI 6) for a responsive and premium design system.
- **Interactive Flashcards**: A "real flashcard" experience featuring a smooth flip animation to reveal detailed back-of-card information like translations, grammar, examples, and notes.
- **Streamlined Card UI**: Standardized premium layout across both the main card list and draft review sections.
- **Client-Side Routing**: Handled seamlessly by TanStack Router for fast navigation.

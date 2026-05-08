# Gemini Chatbot

A minimal, responsive web-based chatbot using the modern Google GenAI SDK (`google-genai`), built with React (Vite) and Python (FastAPI).

## Features
- **Text Conversation**: Chat with Gemini 2.5 Flash.
- **Document Support**: Upload `.txt` or `.pdf` files. The text is extracted and used as context for the conversation.
- **Image Support**: Upload `.jpg` or `.png` images to ask questions about them.
- **Context Management**: Chat context is stored in memory for the active session. History is automatically trimmed to keep the payload efficient.
- **Context Reset**: Click "New Chat" to create a fresh context.
- **Modern UI**: Dark mode, glassmorphism, fluid animations, and a responsive layout using Vanilla CSS.

## Prerequisites
- Node.js (v18+)
- Python (3.9+)

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the root directory.
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory (where `main.py` is located) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. **Start the Backend**:
   From the root directory (ensure your virtual environment is active):
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

2. **Start the Frontend**:
   From the `frontend` directory:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Example Usage Steps

1. **Basic Chat**: Type "Hello, who are you?" and click the Send button.
2. **Document Q&A**: 
   - Click the Document icon to upload a PDF or TXT file.
   - Wait a moment for the backend to process it.
   - Ask "Summarize the document I just uploaded."
3. **Image Q&A**:
   - Click the Image icon to upload a PNG or JPG file.
   - Ask "What is happening in this image?"
4. **Context Reset**:
   - Click the "New Chat" button in the sidebar.
   - Ask "What did I just upload?" -> The bot will indicate it doesn't know, verifying the reset.

## Deployment

### Deploy Backend (Render)
1. Push your repository to GitHub.
2. Go to [Render](https://render.com) -> New Web Service.
3. Connect your repository.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
6. Add `GEMINI_API_KEY` to Environment Variables.
7. Copy the generated live URL (e.g., `https://my-api.onrender.com`).

### Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) -> Add New Project.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL`: Your Render URL followed by `/api` (e.g., `https://my-api.onrender.com/api`).
5. Click **Deploy**.

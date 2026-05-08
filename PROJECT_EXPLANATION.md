# Project Explanation & Interview Guide

This document provides a deep dive into the Gemini Chatbot project. It is structured to help you understand every technical decision, the flow of data, and why specific libraries were chosen. Review this guide to confidently answer any questions an interviewer might ask.

---

## 1. Project Architecture Overview

The project follows a standard **Client-Server Architecture**:
- **Frontend (Client)**: Built with React (via Vite). It handles the user interface, renders chat messages, manages file uploads, and maintains optimistic UI updates (showing messages before the server responds).
- **Backend (Server)**: Built with Python (FastAPI). It acts as the bridge between the React frontend and the Google Gemini AI. It manages the chat history (context), processes uploaded files, and formats the data to be sent to Gemini.

### State Management (The "Memory")
To keep the application simple and responsive (as requested by the constraints), we use **In-Memory State Management**. 
Instead of setting up a database (like PostgreSQL or MongoDB), the backend uses a Python dictionary (`sessions`) to store data.
```python
sessions = {
    "some-unique-chat-id": {
        "history": [...],     # Past messages sent to/from Gemini
        "documents": [...],   # Extracted text from uploaded PDFs/TXTs
        "images": [...]       # Raw bytes of uploaded images
    }
}
```
**Trade-off**: In-memory storage is extremely fast and easy to set up, but it means if the backend server restarts, all chat history is instantly lost.

---

## 2. Backend Tech Stack: Why did we use these libraries?

Here is the exact reason why each Python package was included in the `requirements.txt`:

### `fastapi`
- **What it is**: A modern Python web framework for building APIs.
- **Why we used it**: It is incredibly fast, natively supports `async`/`await` (which is great for waiting on network calls to the Gemini API without blocking the server), and makes defining API endpoints very clean using decorators (e.g., `@app.post`).

### `uvicorn`
- **What it is**: An ASGI (Asynchronous Server Gateway Interface) web server.
- **Why we used it**: FastAPI is just a framework (a set of rules and tools). It needs a web server to actually listen to HTTP requests on a port (like `8000`) and pass them to the FastAPI application. Uvicorn does this job.

### `google-genai`
- **What it is**: The official, modern Google SDK for interacting with Gemini models.
- **Why we used it**: It allows us to easily format prompts, pass chat history, and send multimodal data (images and text) to the `gemini-2.5-flash` model. We specifically construct `types.Content` and `types.Part` objects to build the conversation history exactly how Gemini expects it.

### `pypdf`
- **What it is**: A pure-Python library for reading PDF files.
- **Why we used it**: When a user uploads a PDF, we need to extract the raw text out of it so we can feed it to Gemini as "Document Context". `pypdf` opens the uploaded file bytes, loops through the pages, and extracts the text strings.

### `python-multipart`
- **What it is**: A streaming multipart parser for Python.
- **Why we used it**: When the frontend sends a file (PDF or Image), it sends it via an `HTTP POST` request using `multipart/form-data`. FastAPI requires `python-multipart` to be installed under the hood so it can parse these files and give us the `UploadFile` object in our endpoint.

### `pillow` (PIL - Python Imaging Library)
- **What it is**: The standard image processing library in Python.
- **Why we used it**: When a user uploads an image, we want to make sure it's actually a valid image and not a malicious file disguised as a `.jpg`. We use `Image.open()` and `image.verify()` to validate the file integrity before storing it in our server's memory.

### `python-dotenv`
- **What it is**: A tool that reads key-value pairs from a `.env` file and adds them to environment variables.
- **Why we used it**: Hardcoding API keys in your source code is a major security risk. We use `python-dotenv` so that the `google-genai` SDK can securely read `GEMINI_API_KEY` from the `.env` file without exposing it in the GitHub repository.

---

## 3. How the Features Work (Data Flow)

### Scenario A: Sending a Basic Text Message
1. **Frontend**: User types a message and clicks Send. The React app creates a temporary "User Message" bubble and shows a loading indicator. It sends a `POST /api/chat` request containing the `chat_id` and `message`.
2. **Backend**: 
   - Retrieves the session based on `chat_id`.
   - Appends any uploaded document text to the prompt context.
   - Converts the user's message into a `types.Part`.
   - Grabs the **recent history** (limited to the last 10 messages so we don't exceed token limits).
   - Sends the history + new message to `client.models.generate_content()`.
   - Appends the bot's response to the history and returns it to the frontend.
3. **Frontend**: Removes the loading indicator and displays the bot's response bubble.

### Scenario B: Uploading a Document
1. **Frontend**: User clicks the document icon and selects a `.pdf`. The file is immediately sent to `POST /api/upload/document` via `FormData`.
2. **Backend**:
   - Reads the file bytes.
   - Sees it's a PDF, uses `pypdf` to extract all the text.
   - Stores the extracted string into `session["documents"]`.
3. **Next Message**: When the user asks "Summarize the document", the backend silently injects the extracted text at the top of the prompt.

### Scenario C: Uploading an Image
1. **Frontend**: User clicks the image icon and selects a `.jpg`. Sent to `POST /api/upload/image`.
2. **Backend**:
   - Reads the bytes.
   - Uses `pillow` to verify it's a real image.
   - Stores the raw bytes and MIME type (`image/jpeg`) in `session["images"]`.
3. **Next Message**: When the user asks "What's in this image?", the backend loops through `session["images"]`, creates a `types.Part.from_bytes(...)`, and attaches it to the user's message payload going to Gemini. It then **clears** `session["images"]` so the image isn't re-sent on every subsequent message.

### Scenario D: Context Reset
1. **Frontend**: User clicks "New Chat". React generates a brand new, random `chat_id`.
2. **Backend**: The frontend sends a `POST` request to `/api/session/{chat_id}/reset`. Since it's a new ID, the backend simply ensures there is no old data associated with it. When the first message is sent with this new ID, the backend initializes a completely empty history array. The AI has total amnesia regarding previous conversations.

---

## 4. Potential Interview Questions & How to Answer Them

**Q: Why didn't you use LangChain or LlamaIndex for this?**
*Answer*: "The requirements strictly asked to avoid complex RAG (Retrieval-Augmented Generation), chunking, and embeddings. The goal was a minimal demonstration of API integration and simple state management. LangChain would be over-engineering for a simple memory array and basic text extraction."

**Q: How do you prevent the context window from getting too large and crashing the API?**
*Answer*: "In the `/api/chat` endpoint, I implemented **History Trimming**. I set a `MAX_HISTORY = 10`. Before sending the payload to Gemini, the backend slices the array (`session["history"][-MAX_HISTORY:]`). This ensures the model only remembers the last 5 back-and-forth interactions, keeping the payload lightweight and saving API costs."

**Q: If you were to take this to production, what would you change?**
*Answer*: 
1. "I would replace the in-memory Python dictionary with a real database like PostgreSQL or Redis so chat history survives server restarts."
2. "I would add User Authentication (JWT or OAuth) so `chat_id`s are tied securely to specific users."
3. "Instead of extracting all PDF text at once (which breaks on 500-page books), I would implement vector embeddings and a vector database (like Pinecone) to perform true RAG."

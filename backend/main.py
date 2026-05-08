from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from google import genai
from google.genai import types
from pypdf import PdfReader
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client() # Uses GEMINI_API_KEY from environment

# State management
# {
#   "chat_id": {
#     "history": [types.Content],
#     "documents": ["extracted text"],
#     "images": [PIL.Image]
#   }
# }
sessions: Dict[str, Dict[str, Any]] = {}

def get_session(chat_id: str):
    if chat_id not in sessions:
        sessions[chat_id] = {"history": [], "documents": [], "images": []}
    return sessions[chat_id]

class ChatRequest(BaseModel):
    chat_id: str
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = get_session(request.chat_id)
    
    parts = []
    
    # 1. Add context from documents if available
    for doc in session["documents"]:
        parts.append(types.Part.from_text(text=f"Document Context:\n{doc}\n"))
    
    # 2. Add uploaded images for this message
    for img in session["images"]:
        parts.append(types.Part.from_bytes(data=img["data"], mime_type=img["mime_type"]))
    
    # 3. Add the user's message
    parts.append(types.Part.from_text(text=request.message))
    
    user_content = types.Content(role="user", parts=parts)
    
    # Trim history to keep it recent (last 10 messages = 5 turns)
    MAX_HISTORY = 10
    recent_history = session["history"][-MAX_HISTORY:] if len(session["history"]) > MAX_HISTORY else session["history"]
    
    try:
        all_contents = recent_history + [user_content]
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=all_contents,
        )
        
        bot_response = response.text
        
        # Update history
        session["history"].append(user_content)
        session["history"].append(types.Content(role="model", parts=[types.Part.from_text(text=bot_response)]))
        
        # Clear images from pending state after they've been sent
        session["images"] = []
        
        return ChatResponse(response=bot_response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/document")
async def upload_document(chat_id: str = Form(...), file: UploadFile = File(...)):
    session = get_session(chat_id)
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    ext = file.filename.split('.')[-1].lower()
    content = await file.read()
    
    extracted_text = ""
    if ext == "txt":
        extracted_text = content.decode('utf-8')
    elif ext == "pdf":
        try:
            reader = PdfReader(BytesIO(content))
            for page in reader.pages:
                extracted_text += page.extract_text() + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    session["documents"].append(extracted_text)
    return {"message": "Document uploaded and text extracted", "filename": file.filename}

@app.post("/api/upload/image")
async def upload_image(chat_id: str = Form(...), file: UploadFile = File(...)):
    session = get_session(chat_id)
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    ext = file.filename.split('.')[-1].lower()
    if ext not in ["png", "jpg", "jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPG images are supported")
        
    content = await file.read()
    try:
        image = Image.open(BytesIO(content))
        image.verify() # verify it's an image
        mime_type = "image/jpeg" if ext == "jpg" else f"image/{ext}"
        session["images"].append({"data": content, "mime_type": mime_type})
        return {"message": "Image uploaded successfully", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

@app.post("/api/session/{chat_id}/reset")
async def reset_session(chat_id: str):
    if chat_id in sessions:
        del sessions[chat_id]
    return {"message": "Session reset successful"}

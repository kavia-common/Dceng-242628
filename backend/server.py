from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText
import tempfile

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]
sessions_collection = db["sessions"]
conversations_collection = db["conversations"]

# Initialize AI services
EMERGENT_KEY = os.getenv("EMERGENT_LLM_KEY")

# Pydantic models
class AvatarConfig(BaseModel):
    gender: str  # male, female, non-binary
    skinTone: str  # light, medium, tan, brown, dark
    hairStyle: str
    facialFeature: str

class ConversationMessage(BaseModel):
    speaker: str  # user or other
    text: str
    timestamp: str
    detectedPatterns: Optional[List[Dict]] = []

class SessionCreate(BaseModel):
    userAvatar: AvatarConfig
    otherAvatar: AvatarConfig
    userName: str
    otherName: str

class AnalyzeRequest(BaseModel):
    sessionId: str
    speaker: str
    text: str


# Defense mechanisms detection prompt
SYSTEM_PROMPT = """You are an expert psychologist analyzing conversation patterns. Detect manipulative, toxic, or abusive communication tactics, as well as healthy boundaries.

Analyze the given message and identify ANY of these patterns:

TOXIC/MANIPULATIVE PATTERNS:
1. blame_shifting - Deflecting responsibility onto others
2. gaslighting - Denying reality, making someone question their perception
3. stonewalling - Refusing to engage, silent treatment
4. deflection - Redirecting conversation away from the issue
5. guilt_tripping - Making someone feel guilty to manipulate
6. love_bombing - Excessive flattery or affection to manipulate
7. projection - Accusing others of one's own behavior
8. darvo - Deny, Attack, Reverse Victim and Offender
9. moving_goalposts - Changing requirements after they're met
10. triangulation - Bringing in third party to gang up
11. passive_aggression - Indirect hostility
12. invalidation - Dismissing someone's feelings or experiences
13. circular_reasoning - Going in circles, never resolving
14. victim_playing - Playing victim to avoid accountability
15. word_salad - Confusing, nonsensical speech to confuse
16. hoovering - Trying to pull someone back after ending relationship
17. minimizing - Making issues seem smaller than they are
18. denial - Refusing to acknowledge facts
19. rage - Explosive anger to intimidate
20. silent_treatment - Ignoring as punishment

HEALTHY PATTERNS:
21. healthy_boundary - Setting clear, respectful limits
22. accountability - Taking responsibility
23. validation - Acknowledging others' feelings
24. active_listening - Truly hearing and understanding

WEAPONIZED HEALTHY PATTERNS:
25. weaponized_boundary - Using boundaries to control/punish
26. fake_accountability - Insincere apology to manipulate

Respond ONLY in valid JSON format:
{
  "patterns": [
    {
      "type": "pattern_name",
      "confidence": 0.0-1.0,
      "evidence": "specific quote or behavior"
    }
  ]
}

If no patterns detected, return: {"patterns": []}"""


@app.get("/")
def read_root():
    return {"message": "Discourse Engine API"}


@app.post("/api/session/create")
async def create_session(session_data: SessionCreate):
    """Create a new conversation session"""
    try:
        session = {
            "userAvatar": session_data.userAvatar.dict(),
            "otherAvatar": session_data.otherAvatar.dict(),
            "userName": session_data.userName,
            "otherName": session_data.otherName,
            "createdAt": datetime.utcnow().isoformat(),
            "messages": []
        }
        result = sessions_collection.insert_one(session)
        return {
            "sessionId": str(result.inserted_id),
            "message": "Session created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get session data"""
    try:
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session["_id"] = str(session["_id"])
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio to text using Whisper"""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcribe using OpenAI Whisper
        stt = OpenAISpeechToText(api_key=EMERGENT_KEY)
        
        with open(temp_file_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="json"
            )
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return {
            "text": response.text,
            "success": True
        }
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_message(request: AnalyzeRequest):
    """Analyze message for communication patterns using Claude"""
    try:
        # Initialize Claude
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"analysis_{request.sessionId}",
            system_message=SYSTEM_PROMPT
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Create analysis message
        user_message = UserMessage(
            text=f"Analyze this message from {request.speaker}: \"{request.text}\""
        )
        
        # Get Claude's analysis
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            analysis = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                analysis = {"patterns": []}
        
        # Save message to database
        message_data = {
            "sessionId": request.sessionId,
            "speaker": request.speaker,
            "text": request.text,
            "timestamp": datetime.utcnow().isoformat(),
            "patterns": analysis.get("patterns", [])
        }
        conversations_collection.insert_one(message_data)
        
        # Update session with new message
        sessions_collection.update_one(
            {"_id": ObjectId(request.sessionId)},
            {"$push": {"messages": message_data}}
        )
        
        return {
            "patterns": analysis.get("patterns", []),
            "success": True
        }
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}/messages")
async def get_messages(session_id: str):
    """Get all messages for a session"""
    try:
        messages = list(conversations_collection.find(
            {"sessionId": session_id}
        ).sort("timestamp", 1))
        
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

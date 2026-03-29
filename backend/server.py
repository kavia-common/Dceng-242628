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

class ReEvaluateRequest(BaseModel):
    sessionId: str
    messageId: str
    conversationContext: List[Dict]


# Defense mechanisms detection prompt for initial analysis
SYSTEM_PROMPT = """You are an expert psychologist analyzing conversation patterns. Detect manipulative, toxic, or abusive communication tactics, as well as healthy boundaries.

IMPORTANT: You will analyze messages in TWO PHASES:
1. TENTATIVE detection - when you first see a potential pattern
2. CONFIRMATION or EXONERATION - after seeing more conversation context

For initial messages, mark patterns as "tentative" if you're not 100% certain.
For follow-up analysis with context, determine if the pattern should be "confirmed" or "exonerated".

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
      "evidence": "specific quote or behavior",
      "status": "tentative" or "confirmed"
    }
  ]
}

Mark status as "tentative" if confidence < 0.8 or if more context is needed.
Mark status as "confirmed" if confidence >= 0.8 and pattern is clear.

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
async def get_session(session_id: str, include_messages: bool = False):
    """Get session data"""
    try:
        projection = None if include_messages else {"messages": 0}
        session = sessions_collection.find_one(
            {"_id": ObjectId(session_id)},
            projection
        )
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
        # Get recent conversation context
        recent_messages = list(conversations_collection.find(
            {"sessionId": request.sessionId}
        ).sort("timestamp", -1).limit(5))
        
        # Build context string
        context = ""
        if recent_messages:
            context = "\n\nRecent conversation context:\n"
            for msg in reversed(recent_messages):
                context += f"{msg['speaker']}: {msg['text']}\n"
        
        # Initialize Claude
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"analysis_{request.sessionId}",
            system_message=SYSTEM_PROMPT
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Create analysis message with context
        user_message = UserMessage(
            text=f"{context}\n\nAnalyze this NEW message from {request.speaker}: \"{request.text}\"\n\nConsider the context above when determining if patterns are tentative or confirmed."
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
        
        # Add pattern IDs and default status
        patterns = analysis.get("patterns", [])
        for pattern in patterns:
            pattern["id"] = str(ObjectId())
            if "status" not in pattern:
                pattern["status"] = "tentative" if pattern.get("confidence", 0) < 0.8 else "confirmed"
        
        # Save message to database
        message_data = {
            "sessionId": request.sessionId,
            "speaker": request.speaker,
            "text": request.text,
            "timestamp": datetime.utcnow().isoformat(),
            "patterns": patterns
        }
        result = conversations_collection.insert_one(message_data)
        message_data["_id"] = str(result.inserted_id)
        
        # Update session with new message
        sessions_collection.update_one(
            {"_id": ObjectId(request.sessionId)},
            {"$push": {"messages": message_data}}
        )
        
        return {
            "patterns": patterns,
            "messageId": str(result.inserted_id),
            "success": True
        }
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reevaluate")
async def reevaluate_patterns(request: ReEvaluateRequest):
    """Re-evaluate tentative patterns with additional conversation context"""
    try:
        # Get the message being re-evaluated
        message = conversations_collection.find_one({"_id": ObjectId(request.messageId)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Build full conversation context
        context = "Full conversation history:\n"
        for msg in request.conversationContext:
            context += f"{msg['speaker']}: {msg['text']}\n"
        
        # Get tentative patterns from the message
        tentative_patterns = [p for p in message.get("patterns", []) if p.get("status") == "tentative"]
        
        if not tentative_patterns:
            return {"updates": [], "success": True}
        
        # Initialize Claude for re-evaluation
        reevaluate_prompt = """You are re-evaluating previously detected communication patterns with more conversation context.

For each pattern, determine if it should be:
1. CONFIRMED - The pattern is clearly present with the additional context
2. EXONERATED - The additional context shows this was NOT the harmful pattern initially suspected

Respond ONLY in valid JSON format:
{
  "evaluations": [
    {
      "patternId": "pattern_id",
      "decision": "confirmed" or "exonerated",
      "reason": "brief explanation why"
    }
  ]
}"""
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"reevaluate_{request.sessionId}",
            system_message=reevaluate_prompt
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Create re-evaluation message
        patterns_text = "\n".join([
            f"- Pattern ID: {p['id']}, Type: {p['type']}, Evidence: {p.get('evidence', 'N/A')}"
            for p in tentative_patterns
        ])
        
        user_message = UserMessage(
            text=f"{context}\n\nRe-evaluate these TENTATIVE patterns:\n{patterns_text}"
        )
        
        # Get Claude's re-evaluation
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            evaluation = json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                evaluation = json.loads(json_match.group())
            else:
                evaluation = {"evaluations": []}
        
        # Update patterns in database
        updates = []
        for eval_item in evaluation.get("evaluations", []):
            pattern_id = eval_item.get("patternId")
            decision = eval_item.get("decision")
            reason = eval_item.get("reason", "")
            
            # Update the pattern status in the message
            conversations_collection.update_one(
                {
                    "_id": ObjectId(request.messageId),
                    "patterns.id": pattern_id
                },
                {
                    "$set": {
                        "patterns.$.status": decision,
                        "patterns.$.reevaluationReason": reason
                    }
                }
            )
            
            updates.append({
                "patternId": pattern_id,
                "decision": decision,
                "reason": reason
            })
        
        return {
            "updates": updates,
            "success": True
        }
    except Exception as e:
        print(f"Re-evaluation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}/messages")
async def get_messages(session_id: str, limit: int = 100, skip: int = 0):
    """Get messages for a session with pagination"""
    try:
        messages = list(conversations_collection.find(
            {"sessionId": session_id}
        ).sort("timestamp", 1).skip(skip).limit(limit))
        
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        
        total = conversations_collection.count_documents({"sessionId": session_id})
        
        return {
            "messages": messages,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

from datetime import datetime
from db.database import get_db
from bson import ObjectId

async def save_session(user_id: str, transcript: str, summary: str = ""):
    db = await get_db()
    session_data = {
        "userId": user_id,
        "transcript": transcript,
        "summary": summary,
        "processed": True if summary else False,
        "createdAt": datetime.utcnow()
    }
    result = await db.sessions.insert_one(session_data)
    return str(result.inserted_id)

async def get_last_summary(user_id: str):
    db = await get_db()
    session = await db.sessions.find_one(
        {"userId": user_id, "processed": True},
        sort=[("createdAt", -1)]
    )
    if session:
        return session.get("summary")
    return None

async def get_all_sessions(user_id: str):
    db = await get_db()
    cursor = db.sessions.find({"userId": user_id}).sort("createdAt", -1).limit(10)
    sessions = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        sessions.append(doc)
    return sessions

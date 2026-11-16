
from datetime import datetime, timezone
from database.mongodb import db


# Database collections
users_collection = db["users"]
audits_collection = db["audit_logs"]
feedback_collection = db["feedback"]


# Create database indexes
users_collection.create_index("email", unique=True)

audits_collection.create_index(
    [("created_at", -1)]
)

audits_collection.create_index("user_id")



def save_audit(user_id, submitted_text, content_type,
               education_level, subject, analysis, fact_check=None):

    audit_record = {
        "user_id": user_id,
        "submitted_text": submitted_text,
        "content_type": content_type,
        "education_level": education_level,
        "subject": subject,
        "analysis": analysis,
        "fact_check": fact_check or {
            "total_claims": 0,
            "results": []
        },
        "created_at": datetime.now(timezone.utc)
    }

    result = audits_collection.insert_one(audit_record)

    return str(result.inserted_id)



def get_audit_history(user_id, limit=20):

    records = audits_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit)

    return list(records)


def get_audit_by_id(audit_id, user_id):

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        return audits_collection.find_one({
            "_id": ObjectId(audit_id),
            "user_id": user_id
        })
    except InvalidId:
        return None

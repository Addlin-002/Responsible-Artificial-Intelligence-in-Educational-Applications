from flask import Blueprint, request, jsonify, session

from services.groq_service import analyze_educational_content
from database.models import save_audit, get_audit_history
from services.fact_check_service import fact_check_content

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/analyze", methods=["POST"])
def analyze_content():
    try:
        if "user_id" not in session:
            return jsonify({"error": "Please log in to perform an audit"}), 401
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Request body must contain JSON data"
            }), 400

        submitted_text = data.get("text", "").strip()

        if not submitted_text:
            return jsonify({
                "error": "Please provide educational content to analyze"
            }), 400

        if len(submitted_text) > 10000:
            return jsonify({
                "error": "Content must not exceed 10,000 characters"
            }), 400

        content_type = data.get("content_type", "Educational content")
        education_level = data.get("education_level", "Undergraduate")
        subject = data.get("subject", "General")

        
        # Step 1: Run the existing Responsible AI analysis
        analysis = analyze_educational_content(
            text=submitted_text,
            education_level=education_level,
            subject=subject,
            content_type=content_type
        )

        # Step 2: Verify factual claims using Groq and Tavily
        fact_check = fact_check_content(submitted_text)

        # Step 3: Save both analyses in MongoDB
        audit_id = save_audit(
            user_id=session["user_id"],
            submitted_text=submitted_text,
            content_type=content_type,
            education_level=education_level,
            subject=subject,
            analysis=analysis,
            fact_check=fact_check
        )

        # Step 4: Return the result
        return jsonify({
            "status": "success",
            "message": "Content analyzed and saved successfully",
            "audit_id": audit_id,
            "submitted_text": submitted_text,
            "content_type": content_type,
            "education_level": education_level,
            "subject": subject,
            "analysis": analysis,
            "fact_check": fact_check
        }), 200

    except Exception as error:
        print("Audit error:", error)
        return jsonify({
            "status": "error",
            "message": "Unable to complete the audit"
        }), 500

@audit_bp.route("/history", methods=["GET"])
def audit_history():
    try:
        if "user_id" not in session:
            return jsonify({
                "error": "Please log in to view your audit history"
            }), 401

        records = get_audit_history(session["user_id"])

        history = []
       
        for record in records:
            history.append({
                "audit_id": str(record["_id"]),
                "submitted_text": record["submitted_text"],
                "content_type": record["content_type"],
                "education_level": record["education_level"],
                "subject": record["subject"],
                "analysis": record["analysis"],
                "fact_check": record.get("fact_check", {
                    "total_claims": 0,
                    "results": []
                }),
                "created_at": record["created_at"].isoformat()
            })

        return jsonify({
            "status": "success",
            "total_audits": len(history),
            "history": history
        }), 200

    except Exception as error:
        print("Audit history error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve audit history"
        }), 500

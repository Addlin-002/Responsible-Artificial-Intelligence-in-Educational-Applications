
from flask import Blueprint, request, jsonify, session
from database.models import users_collection
import bcrypt
import re

auth_bp = Blueprint("auth", __name__)


# USER REGISTRATION
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid request"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({"error": "All fields are required"}), 400

        email_pattern = r"^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$"

        if not re.match(email_pattern, email):
            return jsonify({"error": "Invalid email address"}), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must contain at least 8 characters"
            }), 400

        if len(password.encode("utf-8")) > 72:
            return jsonify({
                "error": "Password is too long"
            }), 400

        existing_user = users_collection.find_one({"email": email})

        if existing_user:
            return jsonify({
                "error": "An account with this email already exists"
            }), 409

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        )

        user = {
            "name": name,
            "email": email,
            "password": hashed_password.decode("utf-8"),
            "role": "user"
        }

        users_collection.insert_one(user)

        return jsonify({
            "status": "success",
            "message": "Account created successfully"
        }), 201

    except Exception as error:
        print("Registration error:", error)
        return jsonify({"error": "Registration failed"}), 500


# USER LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid request"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        user = users_collection.find_one({"email": email})

        if not user:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        password_matches = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password"].encode("utf-8")
        )

        if not password_matches:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        session.clear()
        session["user_id"] = str(user["_id"])
        session["user_name"] = user["name"]

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Exception as error:
        print("Login error:", error)
        return jsonify({"error": "Login failed"}), 500


# USER LOGOUT
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully"
    }), 200

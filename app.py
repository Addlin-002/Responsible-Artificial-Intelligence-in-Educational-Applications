import os
from dotenv import load_dotenv

# Load environment variables before importing application routes
load_dotenv()

from flask import Flask, jsonify, render_template, redirect, session

from routes.audit_routes import audit_bp
from routes.auth_routes import auth_bp


app = Flask(__name__)

# Configure Flask secret key
secret_key = os.getenv("SECRET_KEY")

if not secret_key:
    raise ValueError("SECRET_KEY is missing from environment variables")

# Session configuration
app.config.update(
    SECRET_KEY=secret_key,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv(
        "SESSION_COOKIE_SECURE", "false"
    ).lower() == "true"
)

# Register blueprints
app.register_blueprint(audit_bp, url_prefix="/api/audit")
app.register_blueprint(auth_bp, url_prefix="/api/auth")


# Landing page
@app.route("/")
def home():
    return render_template("index.html")


# Registration page
@app.route("/register")
def register_page():
    return render_template("register.html")


# Login page
@app.route("/login")
def login_page():
    return render_template("login.html")


# Protected dashboard page
@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect("/login")

    return render_template(
        "dashboard.html",
        user_name=session.get("user_name", "User")
    )


# Protected audit history page
@app.route("/history")
def history_page():
    if "user_id" not in session:
        return redirect("/login")

    return render_template("history.html")


# Protected AI auditing page
@app.route("/audit")
def audit_page():
    if "user_id" not in session:
        return redirect("/login")

    return render_template("audit.html")


# Protected audit results page
@app.route("/audit/result")
def audit_result_page():
    if "user_id" not in session:
        return redirect("/login")

    return render_template("audit_result.html")


# Health check
@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "backend": "Flask",
        "message": "Backend is working correctly"
    })


if __name__ == "__main__":
    app.run(debug=False, use_reloader=False)
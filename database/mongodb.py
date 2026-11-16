
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is missing from the .env file")

# Connect to MongoDB Atlas
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

# Select our database
db = client["responsible_ai_db"]


def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB Atlas connected successfully!")
        print("Database: responsible_ai_db")
        return True

    except Exception as error:
        print("MongoDB connection failed!")
        print("Error:", error)
        return False


if __name__ == "__main__":
    test_connection()

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "webhook_intelligence")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

def get_db():
    return db

import asyncio
import os
import pandas as pd
import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def test_single_seed():
    load_dotenv()
    url = os.getenv("MONGO_URL")
    db_name = os.getenv("DATABASE_NAME", "webhook_intelligence")
    
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    print("1. Reading 1 row from webhook_events.csv using pandas...")
    # Read just the first row of data
    df = pd.read_csv('../datasets/webhook_events.csv', nrows=1)
    
    # Pandas reads empty CSV cells as NaN. We need to convert them to None (null in MongoDB)
    df = df.where(pd.notnull(df), None)
    
    # Convert the single row DataFrame into a Python dictionary
    record = df.to_dict('records')[0]
    
    print("\n--- Data Extracted from CSV ---")
    print(json.dumps(record, indent=2))
    print("Payload size type:", type(record['payload_size_kb']).__name__)
    
    print("\n2. Pushing to MongoDB (collection: test_events)...")
    # Clean the test collection first
    await db.test_events.delete_many({}) 
    result = await db.test_events.insert_one(record)
    print(f"Inserted successfully with Mongo _id: {result.inserted_id}")
    
    print("\n3. Retrieving from MongoDB Atlas to verify...")
    fetched = await db.test_events.find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string so we can print it
    fetched["_id"] = str(fetched["_id"])
    
    print("\n--- Data Fetched from MongoDB ---")
    print(json.dumps(fetched, indent=2))
    print("Fetched Payload size type:", type(fetched['payload_size_kb']).__name__)
    
    print("\nSUCCESS: Verification complete! Data fits perfectly.")

if __name__ == "__main__":
    asyncio.run(test_single_seed())

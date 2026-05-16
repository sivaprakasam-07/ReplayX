import asyncio
import os
import pandas as pd
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_database():
    load_dotenv()
    url = os.getenv("MONGO_URL")
    db_name = os.getenv("DATABASE_NAME", "webhook_intelligence")
    
    print(f"Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    # Define which CSV maps to which collection
    collections_to_seed = [
        {"file": "../datasets/endpoints.csv", "collection": "endpoints"},
        {"file": "../datasets/webhook_events.csv", "collection": "events"},
        {"file": "../datasets/delivery_attempts.csv", "collection": "delivery_attempts"}
    ]
    
    for item in collections_to_seed:
        file_path = item["file"]
        collection_name = item["collection"]
        
        print(f"\n--- Processing {file_path} ---")
        
        # 1. Clear existing data to prevent duplicates if run multiple times
        print(f"Clearing existing data in '{collection_name}' collection...")
        await db[collection_name].delete_many({})
        
        # 2. Read CSV using Pandas
        print(f"Reading CSV file...")
        df = pd.read_csv(file_path)
        
        # Handle empty cells (NaN -> None) so MongoDB stores them as null
        df = df.where(pd.notnull(df), None)
        
        # 3. Convert to list of dictionaries
        records = df.to_dict('records')
        
        # 4. Insert into MongoDB in batches (to handle large files like delivery_attempts)
        print(f"Inserting {len(records)} records into '{collection_name}'...")
        chunk_size = 5000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            await db[collection_name].insert_many(chunk)
            print(f"  Inserted chunk: {i} to {i + len(chunk)}")
            
        print(f"SUCCESS: Seeded {collection_name}!")

    print("\nAll database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())

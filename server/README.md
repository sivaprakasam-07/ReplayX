# ReplayX Backend API

## How to Run

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Add database credentials:**
Create a `.env` file in this folder:
```env
MONGO_URL="your-mongodb-url"
DATABASE_NAME="webhook_intelligence"
```

3. **Start the server:**
```bash
uvicorn main:app --reload
```

## API Docs
Once the server is running, click here to see and test all APIs: 
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

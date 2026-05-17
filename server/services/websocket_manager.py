from fastapi import WebSocket
from typing import List
import json
from bson import ObjectId

class MongoEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles MongoDB ObjectId and other BSON types"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """
        Broadcasts a JSON message to all connected clients.
        Automatically removes stale/broken connections.
        """
        msg_str = json.dumps(message, cls=MongoEncoder)
        
        # Iterate over a copy of the list to allow safe removal during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_text(msg_str)
            except Exception:
                self.disconnect(connection)

# Singleton instance to be used across the app
manager = ConnectionManager()

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.websocket_manager import manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for the frontend dashboard to connect to.
    It will receive live updates whenever a new webhook event is simulated or processed.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect the frontend to send us data, but we must 
            # await receive_text() to keep the connection open and detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

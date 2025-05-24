from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        print(f"WebSocket connected for session: {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            print(f"WebSocket disconnected for session: {session_id}")

    async def send_progress(self, session_id: str, processed: int, total: int):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json({
                "type": "progress",
                "processed": processed,
                "total": total
            })

    async def send_complete(self, session_id: str, moved_files: List[Dict]):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json({
                "type": "complete",
                "movedFiles": moved_files
            })
            # 완료 메시지 후 연결 종료 가능
            # await self.active_connections[session_id].close()

    async def send_error(self, session_id: str, message: str):
         if session_id in self.active_connections:
            await self.active_connections[session_id].send_json({
                "type": "error",
                "message": message
            })

manager = ConnectionManager()
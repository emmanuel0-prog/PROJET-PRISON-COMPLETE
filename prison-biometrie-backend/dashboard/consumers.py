from channels.generic.websocket import AsyncWebsocketConsumer
import json

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "dashboard"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Cette méthode est appelée par notify_dashboard
    async def send_dashboard_update(self, event):
        data = event["data"]
        await self.send(text_data=json.dumps(data))

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from dashboard.services.ia_avance_service import IAAvanceService


class DashboardIAAvanceConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.group_name = "dashboard_ia_avance"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """
        Le frontend peut envoyer :
        { "action": "refresh" }
        """
        if content.get("action") == "refresh":
            data = await sync_to_async(
                IAAvanceService.get_dashboard_avance
            )()

            await self.send_json({
                "type": "dashboard_update",
                "data": data
            })

    async def dashboard_update(self, event):
        """
        Broadcast vers tous les clients
        """
        await self.send_json({
            "type": "dashboard_update",
            "data": event["data"]
        })
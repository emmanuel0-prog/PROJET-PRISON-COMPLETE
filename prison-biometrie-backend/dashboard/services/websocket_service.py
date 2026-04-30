# dashboard/services/websocket_service.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_dashboard(data):
    """
    Envoie une notification à tous les clients connectés au groupe 'dashboard'.
    data: dict
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "dashboard",
        {
            "type": "send_dashboard_update",  # correspond à la méthode du Consumer
            "data": data
        }
    )
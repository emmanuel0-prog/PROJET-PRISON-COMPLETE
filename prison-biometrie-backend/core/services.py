class NotificationService:
    @staticmethod
    def send(user, title, message, type="INFO"):
        if not user:
            return None

        from .models import Notification

        # 1. Sauvegarde en Base de Données
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=type
        )

        # 2. Push Temps Réel (WebSocket)
        try:
            from dashboard.services.websocket_service import notify_dashboard
            notify_dashboard({
                "type": "NOTIFICATION_LIVE",
                "notification_id": notification.id,
                "title": title,
                "message": message,
                "category": type,
                "user_id": str(user.id)
            })
        except Exception as e:
            # On ne bloque pas le processus si le socket échoue
            print(f"Erreur WebSocket non bloquante : {e}")
            
        return notification
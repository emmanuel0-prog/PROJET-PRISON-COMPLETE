import threading

_thread_locals = threading.local()

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # 🔥 IMPORTANT : prendre le user APRES auth middleware
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            _thread_locals.user = user
        else:
            _thread_locals.user = None

        _thread_locals.ip = self.get_client_ip(request)

        response = self.get_response(request)

        self.cleanup()
        return response

    def cleanup(self):
        if hasattr(_thread_locals, 'user'):
            del _thread_locals.user
        if hasattr(_thread_locals, 'ip'):
            del _thread_locals.ip

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


def get_current_user():
    user = getattr(_thread_locals, 'user', None)
    return user if user and user.is_authenticated else None


def get_current_ip():
    return getattr(_thread_locals, 'ip', '127.0.0.1')
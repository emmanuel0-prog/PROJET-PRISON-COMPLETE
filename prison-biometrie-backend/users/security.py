from django.core.cache import cache
from datetime import timedelta

MAX_ATTEMPTS = 5
BLOCK_TIME = 300  # 5 minutes

def get_cache_key(ip):
    return f"login_attempts_{ip}"

def is_ip_blocked(ip):
    attempts = cache.get(get_cache_key(ip), 0)
    return attempts >= MAX_ATTEMPTS

def register_failed_attempt(ip):
    key = get_cache_key(ip)
    attempts = cache.get(key, 0) + 1
    cache.set(key, attempts, timeout=BLOCK_TIME)
    return attempts

def reset_attempts(ip):
    cache.delete(get_cache_key(ip))
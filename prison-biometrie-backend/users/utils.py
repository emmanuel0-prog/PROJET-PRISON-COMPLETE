import requests

def get_ip_info(ip):
    try:
        res = requests.get(f"http://ip-api.com/json/{ip}").json()

        return {
            "country": res.get("country"),
            "city": res.get("city"),
        }
    except:
        return {"country": "Unknown", "city": "Unknown"}
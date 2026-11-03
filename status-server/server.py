#!/usr/bin/env python3
"""동아리 서버 상태를 JSON으로 알려주는 작은 서버 (Linux, 표준 라이브러리만 사용).

GET /status -> {"online": true, "uptime": 초, "load": 1분 부하, "cpus": 코어 수,
                "memory": 사용률(%), "disk": 사용률(%), "time": 현재 UNIX 시각}

환경 변수
  PORT          수신 포트 (기본 8090)
  BIND          수신 주소 (기본 127.0.0.1, 리버스 프록시 뒤에서만 사용)
  ALLOW_ORIGIN  CORS를 허용할 홈페이지 주소 (기본 *)
"""
import json
import os
import shutil
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8090"))
BIND = os.environ.get("BIND", "127.0.0.1")
ALLOW_ORIGIN = os.environ.get("ALLOW_ORIGIN", "*")


def uptime():
    with open("/proc/uptime") as f:
        return int(float(f.read().split()[0]))


def memory_percent():
    info = {}
    with open("/proc/meminfo") as f:
        for line in f:
            key, value = line.split(":")
            info[key] = int(value.split()[0])
    return round(100 * (1 - info["MemAvailable"] / info["MemTotal"]))


def disk_percent():
    usage = shutil.disk_usage("/")
    return round(100 * usage.used / usage.total)


def snapshot():
    return {
        "online": True,
        "uptime": uptime(),
        "load": round(os.getloadavg()[0], 2),
        "cpus": os.cpu_count(),
        "memory": memory_percent(),
        "disk": disk_percent(),
        "time": int(time.time()),
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] != "/status":
            self.send_error(404)
            return
        body = json.dumps(snapshot()).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", ALLOW_ORIGIN)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer((BIND, PORT), Handler).serve_forever()

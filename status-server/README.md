# 상태 서버

홈페이지에 서버 상태를 보여주기 위한 작은 서버입니다. Python 3만 있으면 되고 설치할 패키지는 없습니다. Linux 전용입니다.

## 실행

```bash
ALLOW_ORIGIN=https://gnuvil.github.io python3 server.py
curl http://127.0.0.1:8090/status
```

기본으로 `127.0.0.1`에서만 받으므로, 외부에는 리버스 프록시를 통해서만 공개됩니다.

## 자동 실행 (systemd)

`/etc/systemd/system/gnuvil-status.service`

```ini
[Unit]
Description=Gnuvil status server
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/gnuvil-status/server.py
Environment=ALLOW_ORIGIN=https://gnuvil.github.io
DynamicUser=yes
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now gnuvil-status
```

## 리버스 프록시 예시

nginx:

```nginx
location /status {
    proxy_pass http://127.0.0.1:8090;
}
```

Caddy:

```
handle /status {
    reverse_proxy 127.0.0.1:8090
}
```

CORS 헤더는 서버가 직접 붙이므로 프록시에서 따로 추가하지 않습니다.

## 홈페이지 연결

`script.js` 맨 위의 `STATUS_URL`에 공개 주소(예: `https://example.org/status`)를 넣습니다. 비워 두면 상태 표시가 숨겨집니다.

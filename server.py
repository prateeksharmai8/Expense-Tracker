"""Tally helper: shows the page and saves your data in data.json.

A web page cannot write files on its own, so this tiny server does it for the page.
It uses only Python's standard library, so there is nothing to install.

Run:
    python server.py            (opens http://127.0.0.1:8000 in your browser)
    python server.py 8080       (use another port if 8000 is busy)

Stop it with Ctrl+C. Your data stays in data.json, so it is still there next time.
"""
import json
import os
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data.json"
HOST = "127.0.0.1"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
MAX_BYTES = 5_000_000  # refuse anything bigger than 5 MB

EMPTY = {"expenses": [], "currency": None, "budget": 0}
write_lock = threading.Lock()


def read_data() -> dict:
    """Return what is stored in data.json (or an empty tracker)."""
    if not DATA_FILE.exists():
        return dict(EMPTY)
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict) and isinstance(data.get("expenses"), list):
            return data
        raise ValueError("unexpected shape")
    except ValueError:
        # Keep the unreadable file instead of overwriting it later.
        backup = DATA_FILE.with_name(f"data.corrupt-{int(time.time())}.json")
        DATA_FILE.rename(backup)
        print(f"data.json could not be read. Saved a copy as {backup.name}")
        return dict(EMPTY)


def write_data(data: dict) -> None:
    """Write safely: temp file first, then swap it in, so a crash never leaves half a file."""
    with write_lock:
        tmp = DATA_FILE.with_name("data.json.tmp")
        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, DATA_FILE)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # always show the latest files and data
        super().end_headers()

    def log_message(self, format, *args):  # keep the terminal quiet for the page's own requests
        if "/api/data" not in getattr(self, "path", ""):
            super().log_message(format, *args)

    # -- helpers ---------------------------------------------------------
    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def request_is_local(self) -> bool:
        """Only accept requests that come from this page, not from other websites."""
        allowed = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
        if self.headers.get("Host", "") not in allowed:
            return False
        origin = self.headers.get("Origin")
        return origin is None or origin in {f"http://{h}" for h in allowed}

    # -- routes ----------------------------------------------------------
    def do_GET(self):
        if urlsplit(self.path).path == "/api/data":
            if not self.request_is_local():
                return self.send_error(403)
            return self.send_json(read_data())
        return super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/data":
            return self.send_error(404)
        if not self.request_is_local():
            return self.send_error(403)
        if self.headers.get_content_type() != "application/json":
            return self.send_error(415)
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0:
            return self.send_error(400)
        if length > MAX_BYTES:
            return self.send_error(413)
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self.send_error(400, "Invalid JSON")
        if not isinstance(payload, dict) or not isinstance(payload.get("expenses"), list):
            return self.send_error(400, "Unexpected data")

        write_data(
            {
                "expenses": payload["expenses"],
                "currency": payload.get("currency"),
                "budget": payload.get("budget", 0),
            }
        )
        self.send_json({"ok": True})


class Server(ThreadingHTTPServer):
    # On Windows, "address reuse" lets two copies of this server share one port, so the page
    # can end up talking to an old copy (and its own data.json). Turn it off there, so a
    # second copy stops with "Port is busy" instead.
    allow_reuse_address = os.name != "nt"


def main() -> None:
    try:
        server = Server((HOST, PORT), Handler)
    except OSError:
        sys.exit(f"Port {PORT} is busy. Try another one, for example: python server.py {PORT + 1}")

    url = f"http://{HOST}:{PORT}"
    print(f"Tally is running at {url}")
    print(f"Your data is saved in: {DATA_FILE}")
    print("Press Ctrl+C to stop.")
    threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped. Your data is safe in data.json.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

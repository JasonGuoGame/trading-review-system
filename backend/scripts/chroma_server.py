"""
ChromaDB HTTP sidecar — runs on Windows host.
Wraps PersistentClient + bge-m3 embedding behind a simple HTTP API.
Go backend (in Docker) calls this via host.docker.internal.

Endpoints:
  GET  /health                    — health check
  POST /query                     — query ChromaDB with embedding
       Body: {"query_text":"...", "n_results":8, "author":"optional"}

Usage:
  python chroma_server.py --port 8001
"""
import os
import sys
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
sys.stderr.reconfigure(encoding='utf-8') if hasattr(sys.stderr, 'reconfigure') else None

# Disable proxies for local Ollama
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

import requests
import chromadb

# ---- config ----
CHROMA_PATH = os.environ.get("CHROMA_DB_PATH", "C:/ws/trading-polices/v_db_shuimu")
COLLECTION_NAME = "market_sentiment"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
EMBED_MODEL = "bge-m3:latest"

# ---- lazy init ----
_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        abs_path = os.path.abspath(CHROMA_PATH)
        print(f"[init] ChromaDB path: {abs_path}")
        _client = chromadb.PersistentClient(path=abs_path)
        _collection = _client.get_or_create_collection(name=COLLECTION_NAME)
        print(f"[init] Collection '{COLLECTION_NAME}' count: {_collection.count()}")
    return _collection


def get_embedding(text: str) -> list:
    url = f"{OLLAMA_URL}/api/embeddings"
    payload = {"model": EMBED_MODEL, "prompt": text[:800]}
    resp = requests.post(url, json=payload, proxies={'http': None, 'https': None}, timeout=30)
    resp.raise_for_status()
    return resp.json()['embedding']


class ChromaHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            try:
                col = get_collection()
                self._send_json(200, {"status": "ok", "collection": COLLECTION_NAME, "count": col.count()})
            except Exception as e:
                self._send_json(500, {"status": "error", "message": str(e)})
        else:
            self._send_json(404, {"error": "not found"})

    def _decode_body(self, raw: bytes) -> str:
        """Decode request body, trying UTF-8 first, then GBK (Windows compat)."""
        try:
            return raw.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return raw.decode('gbk')
            except UnicodeDecodeError:
                return raw.decode('utf-8', errors='replace')

    def do_POST(self):
        if self.path == '/query':
            try:
                length = int(self.headers.get('Content-Length', 0))
                raw = self.rfile.read(length)
                body_str = self._decode_body(raw)
                body = json.loads(body_str)

                query_text = body.get('query_text', '')
                n_results = body.get('n_results', 8)
                author = body.get('author', '')

                if not query_text:
                    self._send_json(400, {"error": "query_text is required"})
                    return

                print(f"[query] text='{query_text[:60]}...' n={n_results} author='{author}'")

                # Embed via bge-m3
                query_vec = get_embedding(query_text)

                # Query ChromaDB
                col = get_collection()
                kwargs = {"query_embeddings": [query_vec], "n_results": n_results}
                if author:
                    kwargs["where"] = {"author": author}

                results = col.query(**kwargs)

                self._send_json(200, {
                    "documents": results.get("documents", [[]]),
                    "metadatas": results.get("metadatas", [[]]),
                    "distances": results.get("distances", [[]]),
                    "error": None,
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                self._send_json(500, {
                    "documents": [[]],
                    "metadatas": [[]],
                    "distances": [[]],
                    "error": str(e),
                })
        else:
            self._send_json(404, {"error": "not found"})


def main():
    parser = argparse.ArgumentParser(description="ChromaDB HTTP sidecar")
    parser.add_argument("--port", type=int, default=8001, help="Listen port")
    parser.add_argument("--host", default="0.0.0.0", help="Listen host")
    args = parser.parse_args()

    # Eager init
    col = get_collection()
    print(f"Collection '{COLLECTION_NAME}' ready with {col.count()} documents")
    print(f"Ollama: {OLLAMA_URL} | Embed model: {EMBED_MODEL}")

    server = HTTPServer((args.host, args.port), ChromaHandler)
    print(f"ChromaDB sidecar listening on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()

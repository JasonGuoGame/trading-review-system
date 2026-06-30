"""
ChromaDB query sidecar — called by Go backend via subprocess.
Reads JSON query from stdin, writes JSON results to stdout.

Input JSON: {"query_text": "...", "n_results": 8, "author": "optional"}
Output JSON: {"documents": [...], "metadatas": [...], "distances": [...], "error": null}
"""
import os
import sys
import json
import traceback

# Force UTF-8 on Windows (Go subprocess reads stdout)
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
sys.stderr.reconfigure(encoding='utf-8') if hasattr(sys.stderr, 'reconfigure') else None

# Disable proxies for local Ollama connection
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

import requests
import chromadb

# ---- config ----
CHROMA_PATH = os.environ.get("CHROMA_DB_PATH", "C:/ws/trading-polices/v_db_shuimu")
COLLECTION_NAME = "market_sentiment"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
EMBED_MODEL = "bge-m3:latest"

# ---- init (lazy) ----
_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _client.get_or_create_collection(name=COLLECTION_NAME)
    return _collection


def get_embedding(text: str) -> list:
    url = f"{OLLAMA_URL}/api/embeddings"
    payload = {"model": EMBED_MODEL, "prompt": text[:800]}
    resp = requests.post(url, json=payload, proxies={'http': None, 'https': None}, timeout=30)
    resp.raise_for_status()
    return resp.json()['embedding']


def query_chroma(input_data: dict) -> dict:
    query_text = input_data.get("query_text", "")
    n_results = input_data.get("n_results", 8)
    author = input_data.get("author", "")

    # Build filter if author provided
    where_filter = None
    if author:
        where_filter = {"author": author}

    # Embed the query using bge-m3
    query_vec = get_embedding(query_text)

    # Query ChromaDB with embedding vector
    collection = get_collection()
    kwargs = {
        "query_embeddings": [query_vec],
        "n_results": n_results,
    }
    if where_filter:
        kwargs["where"] = where_filter

    results = collection.query(**kwargs)

    return {
        "documents": results.get("documents", [[]]),
        "metadatas": results.get("metadatas", [[]]),
        "distances": results.get("distances", [[]]),
    }


def main():
    try:
        raw = sys.stdin.read()
        input_data = json.loads(raw) if raw.strip() else {}
        result = query_chroma(input_data)
        result["error"] = None
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        error_result = {
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
            "error": str(e),
        }
        print(json.dumps(error_result, ensure_ascii=False))
        traceback.print_exc(file=sys.stderr)


if __name__ == "__main__":
    main()

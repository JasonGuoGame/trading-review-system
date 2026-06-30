"""
Ingest forum posts into ChromaDB for RAG retrieval.

Reads posts from a JSON file (one JSON object per line, or a JSON array),
generates bge-m3 embeddings via Ollama, and stores them in ChromaDB.

Input format (JSONL or JSON array):
  {"id": "post_001", "content": "帖子正文...", "author": "张三", "date": "2025-01-15", "title": "标题"}

Or minimal:
  {"content": "帖子正文..."}

Usage:
  python ingest_posts.py posts.jsonl
  python ingest_posts.py posts.jsonl --batch-size 20 --reset
"""
import os
import sys
import json
import argparse
import time

# Force UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
sys.stderr.reconfigure(encoding='utf-8') if hasattr(sys.stderr, 'reconfigure') else None

os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

import requests
import chromadb

# ---- config ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(SCRIPT_DIR, '..', '..', 'v_db_shuimu')
COLLECTION_NAME = "market_sentiment"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
EMBED_MODEL = "bge-m3:latest"


def get_embedding(text: str) -> list:
    url = f"{OLLAMA_URL}/api/embeddings"
    payload = {"model": EMBED_MODEL, "prompt": text[:800]}
    resp = requests.post(url, json=payload, proxies={'http': None, 'https': None}, timeout=30)
    resp.raise_for_status()
    return resp.json()['embedding']


def load_posts(filepath: str) -> list:
    """Load posts from JSONL or JSON array file."""
    posts = []
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read().strip()
        if raw.startswith('['):
            posts = json.loads(raw)
        else:
            for line in raw.splitlines():
                line = line.strip()
                if line:
                    posts.append(json.loads(line))
    return posts


def ingest(filepath: str, batch_size: int = 20, reset: bool = False, delay: float = 0.1):
    posts = load_posts(filepath)
    print(f"📄 Loaded {len(posts)} posts from {filepath}")

    client = chromadb.PersistentClient(path=CHROMA_PATH)

    if reset:
        try:
            client.delete_collection(name=COLLECTION_NAME)
            print(f"🗑️  Deleted existing collection '{COLLECTION_NAME}'")
        except Exception:
            pass

    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"📦 Collection '{COLLECTION_NAME}' has {collection.count()} documents")

    total = len(posts)
    for i in range(0, total, batch_size):
        batch = posts[i:i + batch_size]
        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for post in batch:
            pid = post.get("id", f"post_{i}_{len(ids)}")
            content = post.get("content", "")
            if not content:
                continue

            # Build metadata (store everything except content itself)
            meta = {k: v for k, v in post.items() if k not in ("content", "embedding")}
            # Ensure metadata values are simple types (str, int, float, bool)
            for k, v in meta.items():
                if isinstance(v, (list, dict)):
                    meta[k] = json.dumps(v, ensure_ascii=False)

            vec = get_embedding(content)
            ids.append(pid)
            documents.append(content)
            embeddings.append(vec)
            metadatas.append(meta)

            if delay > 0:
                time.sleep(delay)  # rate-limit Ollama

        if ids:
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            print(f"  ✅ Batch {i // batch_size + 1}: ingested {len(ids)} posts ({(i + len(batch))}/{total})")

    print(f"\n🎉 Done! Collection now has {collection.count()} documents.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest forum posts into ChromaDB")
    parser.add_argument("file", help="Path to posts JSONL or JSON array file")
    parser.add_argument("--batch-size", type=int, default=20, help="Batch size for embedding")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate collection")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between embedding calls (seconds)")
    args = parser.parse_args()

    ingest(args.file, batch_size=args.batch_size, reset=args.reset, delay=args.delay)

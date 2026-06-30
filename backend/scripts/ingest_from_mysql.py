"""
Ingest forum posts from MySQL trading_review.forum_post into ChromaDB.
Generates bge-m3 embeddings via Ollama and stores with full metadata.

Usage:
  python ingest_from_mysql.py [--reset] [--batch-size 20] [--delay 0.1]
"""
import os
import sys
import json
import argparse
import time

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None
sys.stderr.reconfigure(encoding='utf-8') if hasattr(sys.stderr, 'reconfigure') else None

os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

import pymysql
import requests
import chromadb

# ---- config ----
CHROMA_PATH = os.environ.get("CHROMA_DB_PATH", "C:/ws/trading-polices/v_db_shuimu")
COLLECTION_NAME = "market_sentiment"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
EMBED_MODEL = "bge-m3:latest"

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root_secret_2026",
    "database": "trading_review",
    "charset": "utf8mb4",
}


def get_embedding(text: str) -> list:
    url = f"{OLLAMA_URL}/api/embeddings"
    payload = {"model": EMBED_MODEL, "prompt": text[:800]}
    resp = requests.post(url, json=payload, proxies={'http': None, 'https': None}, timeout=30)
    resp.raise_for_status()
    return resp.json()['embedding']


def fetch_posts(conn, all_posts: bool = False) -> list:
    """Fetch forum posts from MySQL that haven't been embedded yet."""
    sql = """
        SELECT id, source, author, title, content, topic, created_time
        FROM forum_post
    """
    if not all_posts:
        sql += " WHERE embedding_done IS NULL OR embedding_done = 0"
    sql += " ORDER BY id ASC"
    with conn.cursor() as cur:
        cur.execute(sql)
        columns = [col[0] for col in cur.description]
        rows = cur.fetchall()
    posts = []
    for row in rows:
        post = dict(zip(columns, row))
        if post.get('created_time'):
            post['created_time'] = post['created_time'].strftime('%Y-%m-%d %H:%M:%S')
        posts.append(post)
    return posts


def mark_embedded(conn, ids: list):
    """Mark posts as embedded in MySQL."""
    if not ids:
        return
    with conn.cursor() as cur:
        # Batch update in chunks to avoid too-large SQL
        chunk = 100
        for i in range(0, len(ids), chunk):
            batch = ids[i:i + chunk]
            placeholders = ','.join(['%s'] * len(batch))
            cur.execute(f"UPDATE forum_post SET embedding_done = 1 WHERE id IN ({placeholders})", batch)
        conn.commit()


def build_document(post: dict) -> str:
    """Build the document text from post fields for embedding."""
    parts = []
    if post.get('title'):
        parts.append(f"标题: {post['title']}")
    if post.get('content'):
        parts.append(post['content'])
    if not parts:
        parts.append(post.get('title') or post.get('summary') or '(无内容)')
    return '\n'.join(parts)


def ingest(reset: bool = False, batch_size: int = 20, delay: float = 0.1, all_posts: bool = False):
    # Connect to MySQL
    conn = pymysql.connect(**MYSQL_CONFIG)
    print(f"Connected to MySQL: {MYSQL_CONFIG['host']}/{MYSQL_CONFIG['database']}")

    posts = fetch_posts(conn, all_posts=all_posts)
    print(f"Fetched {len(posts)} posts from forum_post" + (" (all)" if all_posts else " (not yet embedded)"))

    if not posts:
        print("No new posts to ingest!")
        conn.close()
        return

    # Connect to ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    if reset:
        try:
            client.delete_collection(name=COLLECTION_NAME)
            print(f"Deleted existing collection '{COLLECTION_NAME}'")
        except Exception:
            pass

    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    print(f"Collection '{COLLECTION_NAME}' has {collection.count()} documents")

    total = len(posts)
    ingested = 0
    for i in range(0, total, batch_size):
        batch = posts[i:i + batch_size]
        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for post in batch:
            pid = f"mysql_{post['id']}"
            doc_text = build_document(post)

            # Build metadata with all useful fields
            meta = {
                "author": post.get('author') or '',
                "title": post.get('title') or '',
                "topic": post.get('topic') or '',
                "source": post.get('source') or '',
                "mysql_id": post['id'],
            }
            if post.get('created_time'):
                meta["created_time"] = post['created_time']

            # Remove empty string values (ChromaDB doesn't like them)
            meta = {k: v for k, v in meta.items() if v != ''}

            vec = get_embedding(doc_text)
            ids.append(pid)
            documents.append(doc_text)
            embeddings.append(vec)
            metadatas.append(meta)

            if delay > 0:
                time.sleep(delay)

        if ids:
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            ingested += len(ids)
            print(f"  Batch {i // batch_size + 1}: {len(ids)} posts ({ingested}/{total})")

    # Mark posts as embedded in MySQL
    mysql_ids = [p['id'] for p in posts]
    mark_embedded(conn, mysql_ids)
    conn.close()
    print(f"Marked {len(mysql_ids)} posts as embedding_done=1")
    print(f"\nDone! Collection '{COLLECTION_NAME}' now has {collection.count()} documents.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest forum posts from MySQL into ChromaDB")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate collection")
    parser.add_argument("--all", dest="all_posts", action="store_true", help="Re-ingest all posts (ignore embedding_done flag)")
    parser.add_argument("--batch-size", type=int, default=20, help="Batch size for embedding")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between embedding calls (seconds)")
    args = parser.parse_args()

    ingest(reset=args.reset, batch_size=args.batch_size, delay=args.delay, all_posts=args.all_posts)

#!/usr/bin/env bash
# ListSync - Import anime watchlist from MD file into SQLite database
# Run from the ListSync project directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/prisma/data/listsync.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH. Run 'npx prisma db push' first."
  exit 1
fi

# Parse the MD file and insert into SQLite
python3 << 'PYEOF'
import sqlite3
import re
import os

md_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Titles", "Anime titles to watch.md")
# Fallback to absolute path
if not os.path.exists(md_path):
    md_path = "/home/piyush-kumar/Desktop/obsidian/personal/Research/Titles/Anime titles to watch.md"

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prisma", "data", "listsync.db")

if not os.path.exists(md_path):
    print(f"MD file not found at {md_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Read MD file
with open(md_path, 'r') as f:
    lines = f.readlines()

count = 0
for line in lines:
    line = line.strip()
    if not line:
        continue
    
    # Parse: "1. Title Name -- status" or "1. Title Name"
    match = re.match(r'^\d+\.\s+(.+?)(?:\s*--\s*(.+))?$', line)
    if not match:
        continue
    
    title = match.group(1).strip()
    status_note = match.group(2).strip() if match.group(2) else None
    
    # Map status
    status = "planned"
    current_ep = 0
    if status_note:
        sn = status_note.lower()
        if "completed" in sn:
            status = "completed"
        elif "pending" in sn:
            status = "planned"
        elif "caught up" in sn:
            status = "watching"
        elif sn.startswith("episode"):
            status = "watching"
            ep_match = re.search(r'episode\s+(\d+)', sn)
            if ep_match:
                current_ep = int(ep_match.group(1))
    
    # Insert
    cursor.execute("""
        INSERT INTO Media (id, title, description, category, posterUrl, releaseDate, 
                          totalEpisodes, currentEp, rating, status, genres, platforms, 
                          externalId, externalSource, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (
        f"imported_{count}",
        title,
        None,
        "anime",
        None,
        None,
        None,
        current_ep,
        None,
        status,
        "[]",
        "[]",
        None,
        "jikan"
    ))
    count += 1
    print(f"  ✓ {title} [{status}]")

conn.commit()
conn.close()
print(f"\nImported {count} anime titles into ListSync database.")
PYEOF

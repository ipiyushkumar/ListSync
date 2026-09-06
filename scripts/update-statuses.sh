#!/bin/bash
DB="/home/piyush-kumar/Desktop/obsidian/personal/ListSync/prisma/dev.db"

# Completed anime: set currentEp = totalEpisodes
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Jujutsu Kaisen Season 3' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Cyberpunk Edgerunners' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Devil may cry by Netflix Season 2' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Ragna crimson Season 1' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'The eminence in the shadow Season 1' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Parallel world pharmacy Season 1' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Helck' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'The Aristocrat'\''s Otherworldly Adventure: Serving Gods Who Go Too Far' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'My Isekai Life: I Gained a Second Character Class and Became the Strongest Sage in the World' AND category = 'anime';"
sqlite3 "$DB" "UPDATE Media SET currentEp = totalEpisodes, status = 'completed' WHERE title = 'Uncle from Another World (Isekai Ojisan)' AND category = 'anime';"

# Caught up = watching, all episodes
sqlite3 "$DB" "UPDATE Media SET currentEp = 24, status = 'watching' WHERE title = 'That time I got reincarnated as a slime' AND category = 'anime';"

# Pending = planned
sqlite3 "$DB" "UPDATE Media SET status = 'planned', currentEp = 0 WHERE title = 'Re:Zero 4th season' AND category = 'anime';"

# How a realist hero: MD has no status, reset from on-hold
sqlite3 "$DB" "UPDATE Media SET status = 'planned', currentEp = 0 WHERE title = 'How a realist hero built the kingdom' AND category = 'anime';"

# Verify
echo "=== Updated anime ==="
sqlite3 "$DB" "SELECT title, currentEp, totalEpisodes, status FROM Media WHERE category='anime' AND (status != 'planned' OR currentEp > 0) ORDER BY status, title;"

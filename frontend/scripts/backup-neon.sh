#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/neuroart-backups/$DATE"
mkdir -p "$BACKUP_DIR"

DATABASE_URL="postgresql://neondb_owner:npg_iZHQeYv09Xsk@ep-young-pine-ac6kbxiz-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

echo "Fazendo backup em $BACKUP_DIR..."

psql "$DATABASE_URL" -c "COPY submissions TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/submissions.csv"
echo "✅ submissions.csv"

psql "$DATABASE_URL" -c "COPY posts TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/posts.csv"
echo "✅ posts.csv"

psql "$DATABASE_URL" -c "COPY comments TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/comments.csv"
echo "✅ comments.csv"

psql "$DATABASE_URL" -c "COPY research_proposals TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/research_proposals.csv"
echo "✅ research_proposals.csv"

echo "Backup concluido: $BACKUP_DIR"

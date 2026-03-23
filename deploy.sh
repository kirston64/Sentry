#!/bin/bash
set -e

echo "=== Sentry Dashboard Deploy ==="

# Проверяем наличие .env.production
if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found!"
  echo "  cp .env.production.example .env.production"
  echo "  nano .env.production"
  exit 1
fi

# Первый запуск или обновление?
if [ "$1" = "update" ]; then
  echo "[1/3] Пересобираем образ..."
  docker-compose build --no-cache app

  echo "[2/3] Перезапускаем контейнеры..."
  docker-compose up -d

  echo "[3/3] Применяем миграции БД..."
  docker-compose exec app sh -c "cd /app && npx prisma migrate deploy 2>/dev/null || npx prisma db push"
else
  echo "[1/4] Создаём папку для nginx ssl..."
  mkdir -p nginx/ssl

  echo "[2/4] Собираем образ..."
  docker-compose build app

  echo "[3/4] Запускаем контейнеры..."
  docker-compose up -d

  echo "[4/4] Инициализируем БД и создаём аккаунт..."
  sleep 3
  docker-compose exec app sh -c "
    cd /app &&
    (npx prisma migrate deploy 2>/dev/null || npx prisma db push) &&
    node -e \"
      const { createRequire } = require('module');
      const req = createRequire(import.meta.url);
    \" 2>/dev/null || true
  "
  # Запускаем seed через отдельный контейнер с доступом к volume
  docker run --rm \
    --volumes-from sentry-dashboard \
    --env-file .env.production \
    -e DATABASE_URL=file:/app/data/prod.db \
    $(docker-compose images -q app) \
    node /app/prisma/seed.mjs 2>/dev/null || true
fi

echo ""
echo "=== Done! ==="
echo "Dashboard: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo "Логи: docker-compose logs -f app"

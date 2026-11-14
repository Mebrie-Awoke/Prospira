# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM python:3.12-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    DJANGO_DEBUG=False \
    DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,.ethiodeploy.app
WORKDIR /app/backend
RUN apt-get update \\
    && apt-get install -y --no-install-recommends fonts-dejavu-core \\
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist/ ./frontend_dist/
RUN test -f ./frontend_dist/index.html \
    && DJANGO_DEBUG=True python manage.py collectstatic --noinput \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app app \
    && mkdir -p /app/backend/media \
    && chown app:app /app/backend/media
USER app
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn --bind 0.0.0.0:${PORT:-8000} config.wsgi:application"]

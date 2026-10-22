# Deployment Guide: Render & Supabase

## 1. Prerequisites

- A **Supabase** account with a PostgreSQL project and a private Storage bucket named `interview-recordings`.
- A **Render** account.
- A **Google Gemini** API key with Gemini Live and Gemini 2.5 Flash access.

---

## 2. Supabase Setup

1. **Create Storage Bucket**:
   - In Supabase Dashboard, create a private bucket named `interview-recordings`.
   - Set maximum file size to `50MB`.
2. **Apply Database Migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## 3. Backend Deployment on Render

1. Create a new **Web Service** on Render connected to your repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: `postgresql+psycopg://...` (from Supabase Connection Pooler)
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_KEY`: `your-supabase-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.onrender.com"]`

---

## 4. Frontend Deployment on Render

1. Create a new **Web Service** (or Static Site) on Render.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api/v1`
   - `NEXT_PUBLIC_WS_URL`: `wss://your-backend.onrender.com/api/v1`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-supabase-anon-key`

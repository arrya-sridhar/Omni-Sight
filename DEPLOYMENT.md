# OmniSight AI Deployment Guide

This guide explains how to deploy OmniSight AI from your GitLab repository. The setup consists of deploying the frontend to **Vercel** and the backend to **Render** or **Railway**.

## Prerequisites
- A GitLab repository containing the `omnisight-ai` project.
- Accounts on Vercel and either Render or Railway.

---

## 1. Backend Deployment (Render or Railway)

The backend is built with FastAPI and runs video intelligence models. It is containerized using Docker, which is the easiest way to deploy it.

### Option A: Deploying to Render
1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your GitLab account and select your repository.
3. Scroll down and set the **Environment** to `Docker`.
4. Render will automatically detect the `backend/Dockerfile` if your repo is structured as such. If your `Dockerfile` is inside the `backend` directory, you might need to set the **Root Directory** to `backend`.
5. Under **Advanced**, make sure to add a persistent disk (optional but recommended) to `/app/data` and `/app/uploads` so the SQLite database and models persist across deployments.
6. Click **Create Web Service**. Render will build the Docker container and provide a live URL (e.g., `https://omnisight-backend.onrender.com`).

### Option B: Deploying to Railway
1. Go to the [Railway Dashboard](https://railway.app/) and click **New Project** > **Deploy from GitLab repo**.
2. Select your repository.
3. Once the project is added, click on it, go to **Settings > Root Directory**, and set it to `/backend`.
4. Railway will automatically build the `Dockerfile` inside the `/backend` folder.
5. In **Settings > Networking**, click **Generate Domain** to get a public URL for your backend.
6. (Optional) Add a Volume attached to `/app/data` so your SQLite DB is not wiped out on restarts.

**Important Note for Backend Containers:** The `Dockerfile` is optimized to download the `SentenceTransformers` and `YOLOv8` models during the build process, preventing slow cold starts.

---

## 2. Frontend Deployment (Vercel)

The React frontend can easily be hosted on Vercel.

1. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New... > Project**.
2. Click **Continue with GitLab**, authorize the connection, and import your repository.
3. Configure the Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add a new variable:
     - Name: `VITE_API_URL`
     - Value: `<YOUR_BACKEND_URL>` (e.g., `https://omnisight-backend.onrender.com` or your Railway URL).
5. Click **Deploy**.

Vercel will build the frontend. Because we added a `vercel.json` file, the React SPA routing will work correctly and won't throw 404s when you refresh pages.

---

## 3. Post-Deployment Checks
- Once the frontend is live, open the URL Vercel provided.
- Try uploading a video to ensure the frontend successfully communicates with your deployed backend.
- Verify that the i18n dropdown works to switch languages between English, Hindi, and Tamil.
- Test the AI Video Assistant BYOK online feature if you have an API key.

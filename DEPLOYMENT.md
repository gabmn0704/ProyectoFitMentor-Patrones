# Deployment guide

This project is configured for a public deployment across independent service repositories:

- Frontend: Netlify from `FITMENTOR-FRONT`
- Backend and Postgres: Render Blueprint from `FITMENTOR-BACKEND`
- AI analysis service: Render Blueprint from `FITMENTOR-IA`

## 1. Netlify frontend

The `frontend/netlify.toml` file configures the build and SPA fallback.

Required repository settings:

1. In Netlify, choose Add new site > Import an existing project.
2. Select the `gabmn0704/FITMENTOR-FRONT` repository.
3. Keep the build settings from `netlify.toml` (`npm run build`, publish `dist`).
4. Deploy the site.

The site will be published at:

`https://<nombre-del-sitio>.netlify.app/`

## 2. Render services

Create the backend/database and AI services as separate Render Blueprints:

1. Import `gabmn0704/FITMENTOR-BACKEND` as a Blueprint; it contains `render.yaml` for the backend and Postgres.
2. Import `gabmn0704/FITMENTOR-IA` as a Blueprint; it contains `render.yaml` for the AI service.
3. Wait for all services to finish deployment.

After deployment, set `AI_SERVICE_URL` on the backend to the actual AI service URL if Render assigned a different URL. Set `VITE_API_URL` in Netlify to the actual backend URL, then trigger a new frontend deploy:

- `VITE_API_URL=https://fitmentor-backend.onrender.com`

The backend service is configured with:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `AI_SERVICE_URL`
- `SPRING_PROFILES_ACTIVE=render`

The AI service endpoint is exposed by Render automatically and should be passed into the backend via the `AI_SERVICE_URL` variable.

## 3. Runtime verification

Once the services are live:

- Open the frontend URL.
- Confirm the page loads and no WebSocket connection errors appear.
- Check that `/ws` is reachable from the browser.
- Exercise a pose to confirm the backend receives the payload and returns live feedback.

## 4. Important notes

- The frontend uses `VITE_API_URL` as the backend base URL.
- The backend uses `application-render.yml` for Render's PostgreSQL connection and waits for the actual `AI_SERVICE_URL`.
- The free Render Postgres plan has limited lifetime/storage and is intended for evaluation, not durable production data.
- Actual public access still depends on signing in to Netlify and Render and approving the repository connections.

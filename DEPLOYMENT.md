# Deployment guide

This project is configured for a 3-layer public deployment:

- Frontend: GitHub Pages
- Backend: Render web service
- AI analysis service: Render web service
- Database: Render Postgres

## 1. GitHub Pages

The workflow in `frontend/.github/workflows/pages.yml` builds the React app and publishes it to GitHub Pages.

Required repository settings:

1. Open the frontend repository on GitHub.
2. Go to Settings > Pages.
3. Set Source to GitHub Actions.
4. Confirm the repository has the Pages deployment permission enabled.
5. Push to `main` and wait for the workflow to complete.

The site will be published at:

`https://<usuario>.github.io/FITMENTOR-FRONT/`

## 2. Render services

Use the included `render.yaml` file to create the services in Render:

1. Sign in to Render.
2. Click "Blueprints" and import this repository.
3. Select the `render.yaml` file.
4. Review the generated services:
   - `fitmentor-db`
   - `fitmentor-ai`
   - `fitmentor-backend`
   - `fitmentor-frontend`
5. Wait for all services to finish deployment.

After deployment, update the environment variables in the frontend repository with the real public URLs:

- `VITE_API_URL=https://fitmentor-backend.onrender.com`

For Render, the backend service must expose:

- `DATABASE_URL`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_DRIVER`
- `AI_SERVICE_URL`

The AI service endpoint is exposed by Render automatically and should be passed into the backend via the `AI_SERVICE_URL` variable.

## 3. Runtime verification

Once the services are live:

- Open the frontend URL.
- Confirm the page loads and no WebSocket connection errors appear.
- Check that `/ws` is reachable from the browser.
- Exercise a pose to confirm the backend receives the payload and returns live feedback.

## 4. Important notes

- The frontend uses `VITE_API_URL` as the backend base URL.
- The backend waits for `AI_SERVICE_URL` and stores it in `application.yml`.
- The app is ready for public deployment at the code and configuration level; final live access depends on the GitHub Pages repo setting and the Render account permissions.

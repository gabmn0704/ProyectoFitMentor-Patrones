# FitMentor

FitMentor is a training platform with real-time movement analysis, session tracking and adaptive routines.

## Structure

- `frontend`: React + TypeScript application.
- `mobile`: Expo / React Native app for Android and iOS. It uses a custom development build for native camera frame processing and on-device MoveNet inference; Expo Go is not supported for this full AI path.
- `backend`: Spring Boot application with domain patterns, REST and WebSocket endpoints.
- `ai-service`: FastAPI service for pose analysis.
- `database`: PostgreSQL schema and seed data.
- `infrastructure`: Docker Compose and Kubernetes manifests.

## Local startup

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

The frontend is available at `http://localhost:5173`, the backend at `http://localhost:8080` and the AI service at `http://localhost:8000`.

## Production deployment

The project is ready to deploy in three public layers:

- Frontend: GitHub Pages, using the workflow in `frontend/.github/workflows/pages.yml`
- Backend + AI service: Render web services, using the `render.yaml` blueprint in the repository root
- Database: Render Postgres service managed from the same Render blueprint

For the exact steps and environment variables, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Native mobile app

See [`mobile/README.md`](mobile/README.md) for Android development-build setup. The mobile coach processes camera frames and pose inference on the device. Expo Go cannot load these custom native modules; use a development build installed on the phone.

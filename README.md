# FitMentor

FitMentor is a training platform with real-time movement analysis, session tracking and adaptive routines.

## Repositories

- [Frontend](https://github.com/gabmn0704/FITMENTOR-FRONT): React and TypeScript web application with browser-based MediaPipe pose detection.
- [Backend](https://github.com/gabmn0704/FITMENTOR-BACKEND): Spring Boot REST and WebSocket service with the software design patterns.
- [Pose analysis service](https://github.com/gabmn0704/FITMENTOR-IA): FastAPI service for exercise-specific posture feedback.
- [Database and deployment](https://github.com/gabmn0704/FITMENTOR-BD): PostgreSQL schema, validation workflow and Render Blueprint.
- Native mobile app: Expo and React Native application in `mobile/`.

## Production deployment

The frontend is configured for GitHub Pages. Enable **Settings > Pages > Build and deployment > Source > GitHub Actions** in `FITMENTOR-FRONT`.

Create a Render Blueprint from `FITMENTOR-BD/render.yaml` and authorize its access to the backend and pose-analysis repositories. The Blueprint provisions PostgreSQL and links the backend to the private AI service. Its always-on service and database plans incur provider charges.

Set the `VITE_API_URL` Actions variable in `FITMENTOR-FRONT` to the public Render backend URL. The browser sends selected pose landmarks over WebSocket; video frames remain on-device.

## Native mobile app

See [`mobile/README.md`](mobile/README.md) for Android development-build setup. The mobile coach processes camera frames and pose inference on the device. Expo Go cannot load these custom native modules; use a development build installed on the phone.

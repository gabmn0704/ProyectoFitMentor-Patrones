# FitMentor Mobile

Native Expo app for Android and iOS. The camera and MoveNet pose model run on the device. This app uses native frame-processing libraries, so it requires a development build and does not run in Expo Go.

## Development build

Install dependencies, generate the native projects, and install the Android development app:

```powershell
npm install
npx expo prebuild
npx expo run:android --device
npx expo start --dev-client
```

Android Studio and Android SDK are required for a local Android build. To build in Expo's cloud instead, install and sign in to EAS, then run:

```powershell
npx eas-cli build --platform android --profile development
npx expo start --dev-client
```

Install the generated APK on the phone before starting Metro. Keep the phone and development computer on the same network.

## Pose model

The app downloads the public MoveNet SinglePose Lightning TFLite model the first time it initializes. Internet access is needed for that download; frame inference and camera processing run locally afterward.

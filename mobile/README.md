# FitMentor Mobile

App nativa de FitMentor para Android (y iOS) hecha con Expo SDK 57, React Native 0.86 y TypeScript. Es el equivalente móvil de la web: entrena con la cámara, sigue tu plan, mira tu progreso y habla con el coach.

La cámara y el modelo de postura (MoveNet) corren en el teléfono. El video nunca se sube: solo se envían al backend las coordenadas de las articulaciones, para el feedback de la IA.

## Pantallas

| Pestaña | Qué hace |
| --- | --- |
| Inicio | Saludo, entrenamiento de hoy, racha, meta semanal, estadísticas y siguiente paso de la rutina adaptativa. |
| Entrenar | Cámara + MoveNet en el dispositivo, cuenta atrás, conteo de repeticiones, técnica en vivo, voz opcional, resumen y guardado. Feedback de la IA del backend por STOMP cuando hay conexión. |
| Plan | Rutina semanal personalizada (7 días, semanas de descarga) y plan de alimentación con macros, porciones y equivalentes. |
| Progreso | Racha, estadísticas, carriles de actividad semanal, gráfica de precisión, desglose por ejercicio, logros e historial. |
| Coach | Chat con la IA del backend (`/api/coach`) con el perfil como contexto. |
| Perfil | Cuenta, nivel, edición del plan, estado de sincronización y cierre de sesión. |

Además: inicio de sesión, registro y modo invitado (token en `expo-secure-store`), onboarding del plan, cola offline de sesiones, y estados de carga, vacío y error en todas las pantallas. Tema oscuro, tipografía Outfit y Geist, animaciones con Reanimated, háptica y etiquetas de accesibilidad.

## Estructura

```
src/
  app/           Rutas de expo-router (login, onboarding, edit-body, (tabs)/*)
  components/    BodyForm, SyncBadge
  features/      usePoseEngine (MoveNet + repeticiones), useRealtime (STOMP con el backend)
  lib/           API, servicios, cola offline, plan semanal, nutrición, pose-analysis (lógica pura, con tests)
  state/         AuthProvider, DataProvider (sesiones y sincronización), useRemote y consultas
  ui/            Sistema de diseño: Text, Button, Card/BibTile, Controls, Charts, States, Screen
  theme.ts       Tokens de color, tipografía y radios
assets/brand/    logo.svg (marca oficial) — los iconos se generan con `npm run icons`
```

## Configuración

| Variable | Para qué | Valor por defecto |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base del backend Spring | `https://fitmentor-backend.onrender.com` |

Para un backend local usa tu IP de la red, por ejemplo `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080 npx expo start --dev-client`. En los builds de EAS la variable viene de `eas.json`. No se guarda ningún secreto en el repositorio: ni `.env`, ni keystores.

El plan gratuito de Render duerme el backend; la primera petición puede tardar hasta un minuto y la app espera ese tiempo.

## Desarrollo

```powershell
cd mobile
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest: pose-analysis, cola offline, formato, plan, nutrición, realtime
```

La app usa módulos nativos (Vision Camera, TFLite, Reanimated), así que **no funciona en Expo Go**. Necesitas un development build:

```powershell
npx expo prebuild --platform android
npx expo run:android --device
npx expo start --dev-client
```

El modelo MoveNet Lightning se descarga la primera vez que se abre Entrenar (hace falta internet); después la inferencia es local.

## Generar el APK

Identificador: `com.fitmentor.app`, `versionCode` 1, permisos: cámara, internet, estado de red y vibración. El perfil `preview` de `eas.json` produce un APK instalable (`buildType: apk`).

### Opción 1: EAS Build en la nube (recomendada)

No requiere Android Studio. Necesitas una cuenta de Expo (gratuita); el inicio de sesión lo haces tú.

```powershell
cd mobile
npm install
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Al terminar, EAS imprime un enlace de descarga del `.apk` (también aparece en https://expo.dev). Ábrelo en el teléfono o instálalo con `adb install archivo.apk`. En el primer build EAS ofrece generar y guardar la keystore: acepta. `appVersionSource` es `remote`, así que EAS lleva el número de versión.

Si el `projectId` de `app.json` (`extra.eas.projectId`) pertenece a otra cuenta, ejecuta `npx eas-cli init` para vincular el proyecto a la tuya.

### Opción 2: build local

Requiere JDK 17 o 21 y el Android SDK (plataforma 36, build-tools y NDK; Gradle descarga lo que falte si las licencias están aceptadas). En Windows, **clona o copia el proyecto en una ruta corta** (por ejemplo `C:\fmb`): CMake supera el límite de 260 caracteres con rutas largas.

```powershell
cd mobile
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. Por defecto Expo lo firma con la keystore de depuración: sirve para pruebas internas, pero no para publicar en Play Store (usa el perfil `production`, que genera un AAB firmado por EAS). Las carpetas `android/` e `ios/` están en `.gitignore`: se regeneran con prebuild y no se editan a mano.

## Marca e iconos

`assets/brand/logo.svg` es el logo oficial de FitMentor. `npm run icons` regenera `icon.png`, `android-icon-*`, `splash-icon.png` y `favicon.png` con `@resvg/resvg-js` a los tamaños que pide Expo.

## Notas de diseño

La interfaz sigue el mundo "Race Day" de la web (campo de tinta, cobalto para datos y selección, bermellón solo para la acción principal, el vivo y el error) con Outfit para titulares y números y Geist para texto. El verde menta del logo se reserva para la marca y los estados de éxito. No hay mascota ni personaje.

/**
 * Configuración pública. EXPO_PUBLIC_API_URL se inyecta en el build (ver eas.json);
 * si falta se usa el backend de producción documentado en DEPLOYMENT.md.
 */
const DEFAULT_API_URL = 'https://fitmentor-backend.onrender.com'

export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '')

/** Modelo MoveNet SinglePose Lightning (TFLite), descargado la primera vez. */
export const MOVENET_URL = 'https://www.kaggle.com/models/google/movenet/tfLite/singlepose-lightning/1?lite-format=tflite'

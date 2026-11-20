import type { PosePoint } from '../pose-analysis'
import {
  buildBrokerUrl,
  buildConnectHeaders,
  buildPoseMessage,
  fitsStompFrame,
  isValidSessionId,
  newSessionId,
  parseServerMessage,
} from '../realtime'

const full = (): PosePoint[] => Array.from({ length: 17 }, (_, i) => ({ x: i / 20, y: i / 20, confidence: 0.9 }))

describe('realtime', () => {
  it('construye la URL del broker con ws/wss', () => {
    expect(buildBrokerUrl('https://fitmentor-backend.onrender.com')).toBe('wss://fitmentor-backend.onrender.com/ws')
    expect(buildBrokerUrl('http://10.0.2.2:8080/')).toBe('ws://10.0.2.2:8080/ws')
  })

  it('envía el token solo en el CONNECT', () => {
    expect(buildConnectHeaders('abc')).toEqual({ Authorization: 'Bearer abc' })
    expect(buildConnectHeaders(null)).toEqual({})
  })

  it('genera ids de sesión válidos', () => {
    expect(isValidSessionId(newSessionId())).toBe(true)
    expect(isValidSessionId('con espacios')).toBe(false)
  })

  it('traduce 12 articulaciones MoveNet y acota las coordenadas', () => {
    const points = full()
    points[5] = { x: 3, y: -2, confidence: 4 }
    const message = buildPoseMessage('squat', points, 640.4, 480, 'abc-1')!
    expect(message.points).toHaveLength(12)
    expect(message.points[0]).toEqual({ name: 'left_shoulder', x: 1.5, y: -0.5, confidence: 1 })
    expect(message.frame_width).toBe(640)
    expect(buildPoseMessage('squat', points, 10, 10, 'no válido!')).toBeNull()
    expect(fitsStompFrame(JSON.stringify(message))).toBe(true)
    expect(fitsStompFrame('x'.repeat(9000))).toBe(false)
  })

  it('valida los mensajes del servidor', () => {
    expect(parseServerMessage('no json')).toBeNull()
    expect(parseServerMessage(JSON.stringify({ type: 'state', state: 'ACTIVE_SET' }))).toEqual({ type: 'state', state: 'ACTIVE_SET' })
    const feedback = parseServerMessage(JSON.stringify({ type: 'feedback', score: 87.6, feedback: ['Baja más', 'Espalda recta'], reps: 3 }))
    expect(feedback).toMatchObject({ type: 'feedback', score: 88, message: 'Baja más Espalda recta', reps: 3 })
    expect(parseServerMessage(JSON.stringify({ type: 'feedback', score: 80 }))).toBeNull()
  })
})

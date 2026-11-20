import { Client, type StompSubscription } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { API_URL } from '../lib/config'
import type { ExerciseId, FeedbackMessage } from '../lib/types'
import type { PosePoint } from '../lib/pose-analysis'
import {
  buildBrokerUrl,
  buildConnectHeaders,
  buildPoseMessage,
  feedbackTopic,
  fitsStompFrame,
  isValidSessionId,
  parseServerMessage,
  POSE_DESTINATION,
  POSE_INTERVAL_MS,
} from '../lib/realtime'

export type RealtimeStatus = 'offline' | 'connecting' | 'open' | 'closed'

/** Reconexión: primer reintento a los 2 s, luego con espera creciente hasta 30 s (igual que la web). */
const RECONNECT_MS = 2_000
const MAX_RECONNECT_MS = 30_000
const HEARTBEAT_MS = 10_000

/**
 * Canal STOMP con el backend, que reenvía los landmarks al servicio de IA y devuelve el
 * feedback de técnica. Es opcional: sin conexión la sesión sigue con el análisis local.
 * Solo se conecta mientras `enabled` (durante el entrenamiento) para no gastar batería.
 */
export function useRealtime(token: string | null, enabled: boolean) {
  const [status, setStatus] = useState<RealtimeStatus>('offline')
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const clientRef = useRef<Client | null>(null)
  const subscription = useRef<StompSubscription | null>(null)
  const sessionRef = useRef<string | null>(null)
  const lastSent = useRef(0)
  const failures = useRef(0)

  const subscribe = useCallback((client: Client, sessionId: string) => {
    subscription.current?.unsubscribe()
    subscription.current = client.subscribe(feedbackTopic(sessionId), (frame) => {
      const message = parseServerMessage(frame.body)
      if (message?.type === 'feedback') setFeedback(message)
    })
  }, [])

  useEffect(() => {
    if (!token || !enabled) {
      setStatus('offline')
      return
    }
    setStatus('connecting')
    const client = new Client({
      brokerURL: buildBrokerUrl(API_URL),
      connectHeaders: buildConnectHeaders(token),
      reconnectDelay: RECONNECT_MS,
      heartbeatIncoming: HEARTBEAT_MS,
      heartbeatOutgoing: HEARTBEAT_MS,
      // React Native entrega los frames como texto: hace falta para que STOMP los reconozca.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
    })
    client.onConnect = () => {
      failures.current = 0
      client.reconnectDelay = RECONNECT_MS
      setStatus('open')
      if (sessionRef.current) subscribe(client, sessionRef.current)
    }
    client.onWebSocketClose = () => {
      failures.current += 1
      client.reconnectDelay = Math.min(MAX_RECONNECT_MS, RECONNECT_MS * 2 ** Math.min(4, failures.current - 1))
      subscription.current = null
      setFeedback(null)
      setStatus('closed')
    }
    client.onWebSocketError = () => setStatus('closed')
    client.onStompError = () => setStatus('closed')
    clientRef.current = client
    client.activate()
    return () => {
      subscription.current = null
      clientRef.current = null
      setFeedback(null)
      void client.deactivate()
    }
  }, [token, enabled, subscribe])

  const startSession = useCallback(
    (sessionId: string) => {
      if (!isValidSessionId(sessionId)) return
      sessionRef.current = sessionId
      setFeedback(null)
      const client = clientRef.current
      if (client?.connected) subscribe(client, sessionId)
    },
    [subscribe],
  )

  const endSession = useCallback(() => {
    subscription.current?.unsubscribe()
    subscription.current = null
    sessionRef.current = null
    setFeedback(null)
  }, [])

  /** Publica los landmarks si hay sesión activa y pasó el intervalo mínimo. */
  const sendPose = useCallback((exercise: ExerciseId, points: PosePoint[]): void => {
    const client = clientRef.current
    const id = sessionRef.current
    if (!client?.connected || !id) return
    const now = Date.now()
    if (now - lastSent.current < POSE_INTERVAL_MS) return
    const payload = buildPoseMessage(exercise, points, 192, 192, id)
    if (!payload) return
    const body = JSON.stringify(payload)
    if (!fitsStompFrame(body)) return
    lastSent.current = now
    client.publish({ destination: POSE_DESTINATION, body })
  }, [])

  return { status, connected: status === 'open', feedback, startSession, endSession, sendPose }
}

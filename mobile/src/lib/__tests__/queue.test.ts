import { enqueueSession, flushQueue, markSynced, mergeHistory, MAX_LOCAL_SESSIONS, pendingOf } from '../queue'
import type { ServerSession, SessionPayload } from '../types'

const payload = (reps: number): SessionPayload => ({ exercise: 'squat', reps, accuracy: 80, durationSeconds: 60 })
const when = new Date('2026-03-04T10:00:00Z')

describe('cola offline', () => {
  it('encola sesiones nuevas como pendientes y la más reciente primero', () => {
    let list = enqueueSession([], payload(5), when, 0.1)
    list = enqueueSession(list, payload(8), new Date(when.getTime() + 1000), 0.2)
    expect(list.map((r) => r.reps)).toEqual([8, 5])
    expect(pendingOf(list)).toHaveLength(2)
    expect(new Set(list.map((r) => r.localId)).size).toBe(2)
  })

  it('limita el tamaño de la cola local', () => {
    let list = enqueueSession([], payload(1), when)
    for (let i = 0; i < MAX_LOCAL_SESSIONS + 10; i++) list = enqueueSession(list, payload(i), when)
    expect(list).toHaveLength(MAX_LOCAL_SESSIONS)
  })

  it('sube las pendientes en orden cronológico y las marca', async () => {
    let list = enqueueSession([], payload(5), when, 0.1)
    list = enqueueSession(list, payload(8), new Date(when.getTime() + 1000), 0.2)
    const sent: number[] = []
    const { uploaded, dropped } = await flushQueue(list, async (p) => { sent.push(p.reps) })
    expect(sent).toEqual([5, 8])
    expect(dropped.size).toBe(0)
    expect(pendingOf(markSynced(list, uploaded))).toHaveLength(0)
  })

  it('se detiene ante un fallo de red y conserva las pendientes', async () => {
    let list = enqueueSession([], payload(5), when, 0.1)
    list = enqueueSession(list, payload(8), new Date(when.getTime() + 1000), 0.2)
    const { uploaded } = await flushQueue(list, async () => { throw Object.assign(new Error('red'), { status: 0 }) })
    expect(uploaded.size).toBe(0)
    expect(pendingOf(markSynced(list, uploaded))).toHaveLength(2)
  })

  it('descarta una sesión que el servidor rechaza como inválida (400)', async () => {
    const list = enqueueSession([], payload(5), when, 0.1)
    const { uploaded, dropped } = await flushQueue(list, async () => { throw Object.assign(new Error('x'), { status: 400 }) })
    expect(uploaded.size).toBe(0)
    expect(dropped.size).toBe(1)
  })

  it('no descarta ante 401 ni 429 (se reintenta luego)', async () => {
    const list = enqueueSession([], payload(5), when, 0.1)
    for (const status of [401, 429, 503]) {
      const { dropped } = await flushQueue(list, async () => { throw Object.assign(new Error('x'), { status }) })
      expect(dropped.size).toBe(0)
    }
  })
})

describe('mergeHistory', () => {
  const server: ServerSession[] = [
    { id: 's1', userId: 'u', exercise: 'plank', reps: 1, accuracy: 90, calories: 3, durationSeconds: 40, createdAt: '2026-03-03T09:00:00Z' },
  ]

  it('une servidor y locales pendientes, ordenado por fecha', () => {
    const local = enqueueSession([], payload(5), when, 0.1)
    const merged = mergeHistory(server, local)
    expect(merged.map((e) => e.id)).toEqual([local[0].localId, 's1'])
    expect(merged[0].synced).toBe(false)
  })

  it('sin servidor usa todo lo local', () => {
    const local = markSynced(enqueueSession([], payload(5), when, 0.1), new Set(['x']))
    expect(mergeHistory(null, local)).toHaveLength(1)
  })
})

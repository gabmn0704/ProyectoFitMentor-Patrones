import { apiRequest, resetWarmUp, warmUpBackend } from '../api'

const ok = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ a: 1 }) })

describe('apiRequest', () => {
  afterEach(() => jest.restoreAllMocks())

  it('comparte un solo GET idéntico en vuelo', async () => {
    const fetchMock = jest.fn(ok)
    global.fetch = fetchMock as never
    const [a, b] = await Promise.all([apiRequest('/x', { token: 't' }), apiRequest('/x', { token: 't' })])
    expect(a).toEqual(b)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no deduplica POST', async () => {
    const fetchMock = jest.fn(ok)
    global.fetch = fetchMock as never
    await Promise.all([apiRequest('/x', { method: 'POST', body: {} }), apiRequest('/x', { method: 'POST', body: {} })])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('warmUpBackend', () => {
  it('se limita a una vez dentro del periodo de enfriamiento', () => {
    resetWarmUp()
    const fetchMock = jest.fn(() => Promise.resolve({}))
    global.fetch = fetchMock as never
    warmUpBackend(1_000_000)
    warmUpBackend(1_000_500)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    warmUpBackend(1_000_000 + 5 * 60_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

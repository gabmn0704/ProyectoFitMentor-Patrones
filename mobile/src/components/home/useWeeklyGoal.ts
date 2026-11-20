import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_WEEKLY_GOAL, clampGoal } from '../../lib/engagement'
import { kv } from '../../lib/storage'

/** Meta semanal de sesiones, guardada en el teléfono por usuario. */
export function useWeeklyGoal(userId: string | undefined) {
  const key = `fitmentor.weeklyGoal.${userId ?? 'anon'}`
  const [goal, setGoal] = useState(DEFAULT_WEEKLY_GOAL)

  useEffect(() => {
    let alive = true
    kv.getJSON<number>(key, DEFAULT_WEEKLY_GOAL).then((value) => {
      if (alive && Number.isFinite(value)) setGoal(clampGoal(value))
    })
    return () => {
      alive = false
    }
  }, [key])

  const change = useCallback(
    (delta: number) => {
      setGoal((current) => {
        const next = clampGoal(current + delta)
        void kv.setJSON(key, next)
        return next
      })
    },
    [key],
  )
  return { goal, change }
}

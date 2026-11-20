import { BodyForm } from '../components/BodyForm'
import { useData } from '../state/data'

export default function Onboarding() {
  const { saveBody } = useData()
  return (
    <BodyForm
      title="Armemos tu plan"
      lead="Cuéntanos tu meta y tu punto de partida. Con eso calculamos tu rutina semanal y tu alimentación."
      submitLabel="Crear mi plan"
      onSubmit={saveBody}
    />
  )
}

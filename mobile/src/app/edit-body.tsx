import { router } from 'expo-router'
import { BodyForm } from '../components/BodyForm'
import { useData } from '../state/data'

export default function EditBody() {
  const { body, saveBody } = useData()
  return (
    <BodyForm
      initial={body}
      title="Editar mi plan"
      lead="Si cambias tu meta, tu peso o tus días, la rutina y la alimentación se recalculan."
      submitLabel="Guardar cambios"
      onSubmit={async (profile) => {
        await saveBody(profile)
        router.back()
      }}
      onCancel={() => router.back()}
    />
  )
}

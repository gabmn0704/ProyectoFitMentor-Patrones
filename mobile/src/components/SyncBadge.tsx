import { CloudUpload, WifiOff } from 'lucide-react-native'
import { StyleSheet } from 'react-native'
import { useData } from '../state/data'
import { colors, radii } from '../theme'
import { Pressable } from '../ui/Pressable'
import { Text } from '../ui/Text'

/** Estado de la cola offline: sin conexión o sesiones esperando subir. Se oculta si todo está al día. */
export function SyncBadge() {
  const { online, pending, syncing, sync } = useData()
  if (online && !pending) return null
  const label = !online ? (pending ? `Sin conexión · ${pending} por subir` : 'Sin conexión') : syncing ? 'Subiendo sesiones…' : `${pending} por subir`
  const Icon = online ? CloudUpload : WifiOff
  return (
    <Pressable
      onPress={() => void sync()}
      disabled={!online || syncing}
      accessibilityLabel={`${label}. Toca para reintentar`}
      style={[styles.badge, { backgroundColor: online ? colors.cobaltWash : colors.signalWash }]}
    >
      <Icon size={14} color={online ? colors.cobaltText : colors.signalText} />
      <Text variant="label" color={online ? colors.cobaltText : colors.signalText} style={styles.text}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: radii.xs, paddingHorizontal: 10, paddingVertical: 6 },
  text: { fontSize: 10.5, textTransform: 'none', letterSpacing: 0.4 },
})

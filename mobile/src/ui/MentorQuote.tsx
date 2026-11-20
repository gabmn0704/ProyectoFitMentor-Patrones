import { Quote } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { quoteOfTheDay } from '../lib/engagement'
import { colors, radii } from '../theme'
import { Text } from './Text'

/** Frase del día de Rep: estable durante el día y distinta por persona. */
export function MentorQuote({ userId = '', date }: { userId?: string; date?: Date }) {
  const quote = quoteOfTheDay(date ?? new Date(), userId)
  return (
    <View style={styles.box} accessible accessibilityLabel={`Frase del día de Rep: ${quote}`}>
      <Quote size={16} color={colors.vermilion} />
      <Text variant="small" color={colors.textMuted} style={styles.text}>{quote}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.signalWash, borderRadius: radii.md, padding: 12 },
  text: { flex: 1, fontStyle: 'italic' },
})

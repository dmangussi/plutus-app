import { colors, fonts } from '../styles/theme'

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: 14, textAlign: 'center', padding: '48px 0', color: colors.text3, fontSize: 14,
      fontFamily: fonts.body,
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
      {text}
    </div>
  )
}

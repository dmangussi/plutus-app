import { colors, fonts } from '../styles/theme'

export function LoadingPlaceholder({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: colors.text3, fontFamily: fonts.body }}>
      <div style={{ fontSize: 24, marginBottom: 12, color: colors.primary }}>✳</div>
      {text}
    </div>
  )
}

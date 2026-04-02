import { colors, fonts } from '../styles/theme'

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p style={{
      color: colors.error, fontSize: 13, margin: 0,
      padding: '10px 12px', background: colors.errorBg,
      border: `1px solid ${colors.errorBorder}`, borderRadius: 8,
      fontFamily: fonts.body,
    }}>
      {message}
    </p>
  )
}

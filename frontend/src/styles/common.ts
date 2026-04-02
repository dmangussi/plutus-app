import { colors, fonts } from './theme'

export const inputStyle: React.CSSProperties = {
  padding: '11px 12px',
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  borderRadius: 10,
  fontSize: 13,
  fontFamily: fonts.body,
  outline: 'none',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}

export const btnPrimary: React.CSSProperties = {
  padding: '13px 0',
  background: colors.primary,
  border: 'none',
  color: '#fff',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 14,
  fontWeight: 600,
}

export const btnGhost: React.CSSProperties = {
  padding: '13px 0',
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.text3,
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: fonts.body,
  fontSize: 13,
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  color: colors.text3,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: 6,
  fontWeight: 500,
  fontFamily: fonts.body,
}

export const sectionHeader: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  letterSpacing: 1.5,
  color: colors.text3,
  textTransform: 'uppercase',
  fontFamily: fonts.body,
  fontWeight: 500,
}

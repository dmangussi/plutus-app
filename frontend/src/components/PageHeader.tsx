import { colors, fonts } from '../styles/theme'

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ padding: '52px 20px 20px' }}>
      <h2 style={{
        margin: '0 0 4px', fontSize: 26, fontWeight: 600,
        color: colors.text, fontFamily: fonts.heading, letterSpacing: -0.3,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 13, color: colors.text3, fontFamily: fonts.body }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

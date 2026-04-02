import type { ReactNode } from 'react'
import { colors, fonts } from '../styles/theme'

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000cc',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 16, padding: '24px 20px',
        width: '100%', maxWidth: 360, fontFamily: fonts.body,
      }}>
        {children}
      </div>
    </div>
  )
}

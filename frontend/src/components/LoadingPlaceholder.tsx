import { colors, fonts } from '../styles/theme'
import { CoinIcon } from './CoinIcon'

export function LoadingPlaceholder({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: colors.text3, fontFamily: fonts.body }}>
      <div style={{ marginBottom: 12 }}><CoinIcon size={32} /></div>
      {text}
    </div>
  )
}

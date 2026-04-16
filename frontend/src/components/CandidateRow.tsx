import { formatCurrency } from '../utils/format'
import { colors, fonts } from '../styles/theme'
import type { Category } from '../types/database'
import type { Candidate } from './UploadStep'

export function CandidateRow({ candidate: c, category, categories, selected, duplicate, onToggle, onCategoryChange }: {
  candidate:        Candidate
  category:         Category | undefined
  categories:       Category[]
  selected:         boolean
  duplicate:        boolean
  onToggle:         () => void
  onCategoryChange: (id: string) => void
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px',
        background: duplicate ? '#0e0e0e' : selected ? '#1a1208' : colors.surface,
        border: `1px solid ${duplicate ? colors.border : selected ? '#3a2a18' : colors.border}`,
        borderRadius: 10,
        cursor: duplicate ? 'default' : 'pointer',
        opacity: duplicate ? 0.45 : 1,
        transition: 'all .15s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${selected ? colors.primary : colors.border2}`,
        background: selected ? colors.primary : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#141414', fontWeight: 700,
      }}>
        {selected ? '✓' : ''}
      </div>

      <span style={{ fontSize: 14, flexShrink: 0 }}>{category?.emoji ?? '📦'}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 12, color: selected ? colors.text : colors.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: fonts.body, fontWeight: 500, flex: 1, minWidth: 0 }}>
            {c.description.length > 30 ? c.description.slice(0, 30) + '…' : c.description}
          </div>
          <div style={{ fontSize: 12, color: selected ? colors.text : '#3a3a3a', flexShrink: 0, fontWeight: selected ? 600 : 400, fontFamily: fonts.body }}>
            {formatCurrency(c.amount)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: 10, color: '#3a3a3a', fontFamily: fonts.body, flexShrink: 0 }}>{c.date}</span>
            {duplicate && (
              <span style={{ fontSize: 9, color: '#5a8a5a', background: '#0e1a0e', border: '1px solid #1e3a1e', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', fontFamily: fonts.body }}>
                já importada
              </span>
            )}
            {!duplicate && c.suggestionMatch && (
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, fontFamily: fonts.body, color: c.suggestionMatch === 'exact' ? colors.primary : colors.text3, textTransform: 'uppercase' }}>
                {c.suggestionMatch === 'exact' ? '✓ histórico' : '~ sugerido'}
              </span>
            )}
          </div>
          <select
            value={c.categoryId ?? ''}
            onClick={e => e.stopPropagation()}
            onChange={e => onCategoryChange(e.target.value)}
            style={{
              padding: '2px 4px', background: colors.bg,
              border: `1px solid ${colors.border}`, color: colors.text2,
              borderRadius: 5, fontSize: 10, fontFamily: fonts.body, flexShrink: 0,
            }}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

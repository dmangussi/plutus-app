import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { useLoading } from '../hooks/useLoading'
import { Modal } from './Modal'
import { colors, fonts } from '../styles/theme'
import { btnGhost } from '../styles/common'

export function DeleteConfirmModal({ id, onDeleted, onClose }: {
  id:        string
  onDeleted: () => void
  onClose:   () => void
}) {
  const { show, hide } = useLoading()
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  async function handleDelete() {
    setDeleting(true)
    show('Excluindo transação...')
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      onDeleted()
    } catch (e) {
      setError((e as Error).message || 'Erro ao excluir.')
    } finally {
      hide()
      setDeleting(false)
    }
  }

  return (
    <Modal>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: colors.surface2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, margin: '0 auto 14px',
        }}>🗑</div>
        <div style={{ color: colors.text, fontSize: 16, marginBottom: 6, fontWeight: 600, fontFamily: fonts.heading }}>
          Excluir transação?
        </div>
        <div style={{ fontSize: 13, color: colors.text3, marginBottom: 24 }}>
          Esta ação não pode ser desfeita.
        </div>
        {error && <div style={{ fontSize: 12, color: colors.dangerText, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, color: colors.text2 }}>Cancelar</button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: 1, padding: 13, background: colors.dangerBg,
              border: `1px solid ${colors.dangerBorder}`, color: colors.dangerText,
              cursor: 'pointer', borderRadius: 10, fontFamily: fonts.body, fontWeight: 600, fontSize: 13,
            }}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

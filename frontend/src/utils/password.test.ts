import { describe, it, expect } from 'vitest'
import { passwordChangeError } from './password'

describe('passwordChangeError', () => {
  it('returns null when all inputs are valid', () => {
    expect(passwordChangeError('old123', 'newpass1', 'newpass1')).toBeNull()
  })

  it('errors when current password is empty', () => {
    expect(passwordChangeError('', 'newpass1', 'newpass1')).toBe('Informe a senha atual')
  })

  it('errors when new password is shorter than 6 chars', () => {
    expect(passwordChangeError('old123', 'abc', 'abc')).toBe('Mínimo 6 caracteres')
  })

  it('errors when new password is exactly 5 chars', () => {
    expect(passwordChangeError('old123', 'abcde', 'abcde')).toBe('Mínimo 6 caracteres')
  })

  it('accepts new password of exactly 6 chars', () => {
    expect(passwordChangeError('old123', 'abcdef', 'abcdef')).toBeNull()
  })

  it('errors when confirm does not match new password', () => {
    expect(passwordChangeError('old123', 'newpass1', 'newpass2')).toBe('As senhas não coincidem')
  })
})

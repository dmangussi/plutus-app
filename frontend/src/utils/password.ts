/**
 * Returns a validation error message for a password change form,
 * or null when all inputs are valid and the form can be submitted.
 */
export function passwordChangeError(
  current:  string,
  next:     string,
  confirm:  string,
): string | null {
  if (!current)         return 'Informe a senha atual'
  if (next.length < 6)  return 'Mínimo 6 caracteres'
  if (next !== confirm)  return 'As senhas não coincidem'
  return null
}

export const normalizePhone = (value?: string | null): string => {
  if (!value) {
    return ''
  }

  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  return `+${digits}`
}









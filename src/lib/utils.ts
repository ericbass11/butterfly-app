/** Concatena classes condicionalmente (mini-clsx sem dependência externa). */
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Lê um File de imagem como data URL (base64) para preview no modo demo. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function pct(ratio: number): string {
  return `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%`
}

/** Converte um data URL (base64) em Blob, para upload no Supabase Storage. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(head)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Rótulo relativo simples para datas (yyyy-mm-dd) usado nos painéis. */
export function relativeDay(dateStr: string | null): string {
  if (!dateStr) return '—'
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((today.setHours(0, 0, 0, 0) - d.getTime()) / 86400000)
  if (diff <= 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return `Há ${diff} dias`
  return d.toLocaleDateString('pt-BR')
}

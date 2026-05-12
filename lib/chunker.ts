export function chunkText(text: string): string[] {
  if (!text) return []

  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
  const chunks: string[] = []
  const maxLength = 1000

  let currentChunk = ''

  const flushChunk = () => {
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
  }

  const addText = (textToAdd: string) => {
    if (!currentChunk) {
      currentChunk = textToAdd
      return
    }

    if ((currentChunk.length + 2 + textToAdd.length) <= maxLength) {
      currentChunk = `${currentChunk}\n\n${textToAdd}`
      return
    }

    flushChunk()
    currentChunk = textToAdd
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      addText(paragraph)
      continue
    }

    const sentences = paragraph.match(/[^.!?]+[.!?]+[\])'"`’”]*|[^.!?]+$/g) || [paragraph]
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (trimmedSentence.length > maxLength) {
        let start = 0
        while (start < trimmedSentence.length) {
          const slice = trimmedSentence.slice(start, start + maxLength)
          if (currentChunk) {
            flushChunk()
          }
          chunks.push(slice.trim())
          start += maxLength
        }
        continue
      }

      if (!currentChunk) {
        currentChunk = trimmedSentence
        continue
      }

      if ((currentChunk.length + 1 + trimmedSentence.length) <= maxLength) {
        currentChunk = `${currentChunk} ${trimmedSentence}`
      } else {
        flushChunk()
        currentChunk = trimmedSentence
      }
    }
  }

  flushChunk()
  return chunks
}

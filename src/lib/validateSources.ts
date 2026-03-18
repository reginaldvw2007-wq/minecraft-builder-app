export const MAX_REFERENCE_FILES = 8
export const MAX_REFERENCE_FILE_SIZE_BYTES = 8_000_000
export const MIN_RECOMMENDED_REFERENCE_COUNT = 3

type RejectedFile = {
  fileName: string
  reason: string
}

export type ReferenceValidationResult = {
  acceptedFiles: File[]
  rejectedFiles: RejectedFile[]
  messages: string[]
}

export function validateReferenceFiles(files: File[]): ReferenceValidationResult {
  const acceptedFiles: File[] = []
  const rejectedFiles: RejectedFile[] = []
  const messages: string[] = []
  const limitedFiles = files.slice(0, MAX_REFERENCE_FILES)

  if (files.length > MAX_REFERENCE_FILES) {
    messages.push(`Only the first ${MAX_REFERENCE_FILES} files were considered.`)
  }

  for (const file of limitedFiles) {
    if (!file.type.startsWith('image/')) {
      rejectedFiles.push({ fileName: file.name, reason: 'not an image file' })
      continue
    }

    if (file.size > MAX_REFERENCE_FILE_SIZE_BYTES) {
      rejectedFiles.push({
        fileName: file.name,
        reason: `larger than ${Math.round(MAX_REFERENCE_FILE_SIZE_BYTES / 1_000_000)} MB`,
      })
      continue
    }

    acceptedFiles.push(file)
  }

  return {
    acceptedFiles,
    rejectedFiles,
    messages,
  }
}

export function summarizeReferenceValidation(result: ReferenceValidationResult) {
  const parts = [...result.messages]

  if (result.rejectedFiles.length > 0) {
    const rejectedSummary = result.rejectedFiles
      .map((file) => `${file.fileName} (${file.reason})`)
      .join('; ')

    parts.push(
      `Skipped ${result.rejectedFiles.length} file${
        result.rejectedFiles.length === 1 ? '' : 's'
      }: ${rejectedSummary}.`,
    )
  }

  return parts.join(' ')
}

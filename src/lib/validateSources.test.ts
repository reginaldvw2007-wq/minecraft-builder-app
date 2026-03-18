import { describe, expect, it } from 'vitest'
import {
  MAX_REFERENCE_FILE_SIZE_BYTES,
  summarizeReferenceValidation,
  validateReferenceFiles,
} from './validateSources'

describe('validateReferenceFiles', () => {
  it('accepts supported image files', () => {
    const result = validateReferenceFiles([
      new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
      new File(['roof'], 'roof.png', { type: 'image/png' }),
    ])

    expect(result.acceptedFiles).toHaveLength(2)
    expect(result.rejectedFiles).toHaveLength(0)
  })

  it('rejects unsupported or oversized files with a readable summary', () => {
    const result = validateReferenceFiles([
      new File(['front'], 'front.jpg', { type: 'image/jpeg' }),
      new File(['notes'], 'notes.txt', { type: 'text/plain' }),
      new File([new Uint8Array(MAX_REFERENCE_FILE_SIZE_BYTES + 1)], 'roof.jpg', {
        type: 'image/jpeg',
      }),
    ])

    expect(result.acceptedFiles).toHaveLength(1)
    expect(result.rejectedFiles).toHaveLength(2)

    const summary = summarizeReferenceValidation(result)
    expect(summary).toContain('notes.txt (not an image file)')
    expect(summary).toContain('roof.jpg (larger than 8 MB)')
  })
})

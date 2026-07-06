import api from './axios'
import type { PdfSummaryResponse } from '../types'

export const pdfApi = {
  summarize: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<PdfSummaryResponse>('/pdf/summarize', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // Groq AI peut prendre du temps
      })
      .then((r) => r.data)
  },
}

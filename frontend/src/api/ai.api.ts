import api from './axios'
import type { AiChatRequest, AiChatResponse } from '../types'

export const aiApi = {
  chat: (req: AiChatRequest) =>
    api.post<AiChatResponse>('/ai/chat', req).then((r) => r.data),
}

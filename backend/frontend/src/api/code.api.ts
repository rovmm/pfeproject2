import api from './axios'
import type { CodeExecuteRequest, CodeExecuteResponse } from '../types'

export const codeApi = {
  execute: (data: CodeExecuteRequest) =>
    api.post<CodeExecuteResponse>('/code/execute', data).then((r) => r.data),
}

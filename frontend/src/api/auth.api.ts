import api from './axios'
import type { LoginRequest, RegisterRequest, AuthResponse, UserResponse, UpdateUserRequest } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    api.get<UserResponse>('/users/me').then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.put<UserResponse>('/users/me', data).then((r) => r.data),
}

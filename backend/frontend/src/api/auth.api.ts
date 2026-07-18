import api from './axios'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  UpdateUserRequest,
  VerifyEmailRequest,
  ResendOtpRequest,
  MessageResponse,
} from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<AuthResponse>('/auth/verify-email', data).then((r) => r.data),

  resendOtp: (data: ResendOtpRequest) =>
    api.post<MessageResponse>('/auth/resend-otp', data).then((r) => r.data),

  getMe: () =>
    api.get<UserResponse>('/users/me').then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.put<UserResponse>('/users/me', data).then((r) => r.data),
}

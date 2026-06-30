import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { StudentDashboard } from './pages/StudentDashboard'
import { ProfessorDashboard } from './pages/ProfessorDashboard'
import { ProfessorSession } from './pages/ProfessorSession'
import { QuizCreator } from './pages/QuizCreator'
import { StudentSession } from './pages/StudentSession'
import { AdminDashboard } from './pages/AdminDashboard'
import { CodeEditor } from './pages/CodeEditor'
import { PdfSimplifier } from './pages/PdfSimplifier'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { currentUser } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={
          currentUser?.role === 'PROF'  ? '/professor/dashboard' :
          currentUser?.role === 'ADMIN' ? '/admin/dashboard'     :
          '/student/dashboard'
        } replace />} />

        {/* Shared tools */}
        <Route path="code-editor"   element={<CodeEditor />} />
        <Route path="pdf-simplifier" element={<PdfSimplifier />} />

        {/* Admin */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Professor */}
        <Route
          path="professor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PROF']}>
              <ProfessorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="professor/session/:id"
          element={
            <ProtectedRoute allowedRoles={['PROF']}>
              <ProfessorSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="professor/session/:id/quiz/create"
          element={
            <ProtectedRoute allowedRoles={['PROF']}>
              <QuizCreator />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/session/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentSession />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

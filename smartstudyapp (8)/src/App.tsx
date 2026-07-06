import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import AppShell from './layout/AppShell';
import RequireRole from './layout/RequireRole';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/student/Dashboard';
import StudentCodeSession from './pages/student/CodeSession';
import QuizIntro from './pages/student/QuizIntro';
import QuizTaking from './pages/student/QuizTaking';
import QuizResults from './pages/student/QuizResults';
import CodeEditor from './pages/student/CodeEditor';
import PdfSimplifier from './pages/student/PdfSimplifier';

import ProfessorDashboard from './pages/professor/Dashboard';
import ProfessorCodeSessionLive from './pages/professor/CodeSessionLive';
import ProfessorQuizSessionLive from './pages/professor/QuizSessionLive';
import QuizCreator from './pages/professor/QuizCreator';

import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<RequireRole role="student" />}>
              <Route element={<AppShell />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/editor" element={<CodeEditor />} />
                <Route path="/student/pdf" element={<PdfSimplifier />} />
                <Route path="/student/session/:id/code" element={<StudentCodeSession />} />
                <Route path="/student/session/:id/quiz" element={<QuizIntro />} />
                <Route path="/student/session/:id/quiz/take" element={<QuizTaking />} />
                <Route path="/student/session/:id/results" element={<QuizResults />} />
              </Route>
            </Route>

            <Route element={<RequireRole role="professor" />}>
              <Route element={<AppShell />}>
                <Route path="/professor" element={<ProfessorDashboard />} />
                <Route path="/professor/sessions" element={<ProfessorDashboard />} />
                <Route path="/professor/session/:id/code" element={<ProfessorCodeSessionLive />} />
                <Route path="/professor/session/:id/quiz" element={<ProfessorQuizSessionLive />} />
                <Route path="/professor/quiz-creator" element={<QuizCreator />} />
              </Route>
            </Route>

            <Route element={<RequireRole role="admin" />}>
              <Route element={<AppShell />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard showStats={false} />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

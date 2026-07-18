import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { AiRestrictionProvider } from './lib/aiRestriction';
import { ToastProvider } from './components/Toast';
import AppShell from './layout/AppShell';
import RequireRole from './layout/RequireRole';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

import StudentDashboard from './pages/student/Dashboard';
import StudentCodeSession from './pages/student/CodeSession';
import QuizIntro from './pages/student/QuizIntro';
import QuizTaking from './pages/student/QuizTaking';
import QuizResults from './pages/student/QuizResults';
import CodeEditor from './pages/student/CodeEditor';
import PdfSimplifier from './pages/student/PdfSimplifier';
import StudentDrive from './pages/drive/StudentDrive';

import ProfessorDashboard from './pages/professor/Dashboard';
import ProfessorCodeSessionLive from './pages/professor/CodeSessionLive';
import ProfessorQuizSessionLive from './pages/professor/QuizSessionLive';
import QuizCreator from './pages/professor/QuizCreator';
import ProfessorDrive from './pages/drive/ProfessorDrive';

import AdminDashboard from './pages/admin/Dashboard';
import AiAssistant from './pages/AiAssistant';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <AiRestrictionProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route element={<RequireRole role="student" />}>
              <Route element={<AppShell />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/editor" element={<CodeEditor />} />
                <Route path="/student/pdf" element={<PdfSimplifier />} />
                <Route path="/student/session/:id/code" element={<StudentCodeSession />} />
                <Route path="/student/session/:id/quiz" element={<QuizIntro />} />
                <Route path="/student/session/:id/quiz/take" element={<QuizTaking />} />
                <Route path="/student/session/:id/results" element={<QuizResults />} />
                <Route path="/student/ai-assistant" element={<AiAssistant />} />
                <Route path="/student/drive" element={<StudentDrive />} />
                <Route path="/student/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<RequireRole role="professor" />}>
              <Route element={<AppShell />}>
                <Route path="/professor" element={<ProfessorDashboard />} />
                <Route path="/professor/sessions" element={<ProfessorDashboard />} />
                <Route path="/professor/session/:id/code" element={<ProfessorCodeSessionLive />} />
                <Route path="/professor/session/:id/quiz" element={<ProfessorQuizSessionLive />} />
                <Route path="/professor/quiz-creator" element={<QuizCreator />} />
                <Route path="/professor/ai-assistant" element={<AiAssistant />} />
                <Route path="/professor/drive" element={<ProfessorDrive />} />
                <Route path="/professor/profile" element={<Profile />} />
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
      </AiRestrictionProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

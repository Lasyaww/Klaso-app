import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';

import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

import { AttendancePage } from './pages/AttendancePage';
import { TimetablePage } from './pages/TimetablePage';
import { AIStudyBuddyPage } from './pages/AIStudyBuddyPage';
import { NotesPage } from './pages/NotesPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { MySemestersPage } from './pages/MySemestersPage';
import { SemesterSubjectsPage } from './pages/SemesterSubjectsPage';
import { SubjectDetailsPage } from './pages/SubjectDetailsPage';

import { FacultyAttendancePage } from './pages/FacultyAttendancePage';
import { ProfilePage } from './pages/ProfilePage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based Dashboard switch
const DashboardSwitch = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'faculty') return <FacultyDashboard />;
  return <StudentDashboard />;
};

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardSwitch />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <AttendancePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/semesters"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <MySemestersPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/semesters/:semId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <SemesterSubjectsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects/:subjectId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <SubjectDetailsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TimetablePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-study-buddy"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AIStudyBuddyPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <NotesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QuizzesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty/attendance"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <MainLayout>
                  <FacultyAttendancePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty/attendance/:classId"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <MainLayout>
                  <FacultyAttendancePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/management"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

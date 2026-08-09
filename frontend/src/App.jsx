import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CandidateLoginPage } from './pages/CandidateLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CandidatePage } from './pages/CandidatePage';
import { InterviewPage } from './pages/InterviewPage';
import { ResultPage } from './pages/ResultPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/candidate/login" element={<CandidateLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate"
        element={
          <ProtectedRoute role="candidate">
            <CandidatePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview"
        element={
          <ProtectedRoute role="candidate">
            <InterviewPage />
          </ProtectedRoute>
        }
      />

      <Route path="/report" element={<ResultPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

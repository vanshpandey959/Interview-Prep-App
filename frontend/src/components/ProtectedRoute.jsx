import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';

/**
 * Wrap a route element to require a given role ('admin' | 'candidate').
 * Redirects to the matching login page, preserving where the user was headed.
 */
export const ProtectedRoute = ({ role, children }) => {
  const location = useLocation();
  const { role: currentRole } = useAuthStore();

  if (currentRole !== role) {
    const loginPath = role === 'admin' ? '/admin/login' : '/candidate/login';
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  return children;
};

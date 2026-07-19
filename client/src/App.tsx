import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { OperationsPage } from '@/pages/OperationsPage';
import { FanPage } from '@/pages/FanPage';
import { VolunteerPage } from '@/pages/VolunteerPage';
import { TournamentAccess } from '@/pages/TournamentAccess';
import { Unauthorized } from '@/pages/Unauthorized';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="access" element={<TournamentAccess />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          
          <Route 
            path="fan" 
            element={
              <ProtectedRoute allowedRoles={['FAN', 'OPERATIONS']}>
                <FanPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="volunteer" 
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER', 'OPERATIONS']}>
                <VolunteerPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="operations" 
            element={
              <ProtectedRoute allowedRoles={['OPERATIONS']}>
                <OperationsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}


import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { OperationsPage } from '@/pages/OperationsPage';
import { FanPage } from '@/pages/FanPage';
import { VolunteerPage } from '@/pages/VolunteerPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="fan" element={<FanPage />} />
        <Route path="volunteer" element={<VolunteerPage />} />
      </Route>
    </Routes>
  );
}

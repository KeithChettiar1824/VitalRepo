import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RepoProvider } from './context/RepoContext';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { HealthPage } from './pages/HealthPage';
import { DependenciesPage } from './pages/DependenciesPage';
import { TrendsPage } from './pages/TrendsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <RepoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="dependencies" element={<DependenciesPage />} />
            <Route path="trends" element={<TrendsPage />} />
            <Route path="simulator" element={<SimulatorPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RepoProvider>
  );
}

export default App;

import { Route, Routes } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import AddProblemPage from './pages/AddProblemPage';
import { useAuth } from './context/AuthContext';

const App = (): JSX.Element => {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <div className="app-shell">
        <main className="app-shell__content">
          <div className="app-loading">Loading your workspace…</div>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/problems/new" element={<AddProblemPage />} />
        <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
      </Route>
    </Routes>
  );
};

export default App;

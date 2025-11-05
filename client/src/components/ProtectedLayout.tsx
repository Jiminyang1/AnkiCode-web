import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from './NavBar';

const ProtectedLayout = (): JSX.Element => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;


import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = (): JSX.Element => {
  const { logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__brand">AnkiCode</div>
      <nav className="navbar__actions">
        <Link to="/dashboard" className="navbar__link">
          Dashboard
        </Link>
        <Link to="/problems/new" className="navbar__link">
          Add problem
        </Link>
        <button type="button" className="navbar__button" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
};

export default NavBar;


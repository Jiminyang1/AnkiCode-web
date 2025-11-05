import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = (): JSX.Element => {
  const { login, user, loading, error } = useAuth();
  const [email, setEmail] = useState('demo@ankicode.dev');
  const [password, setPassword] = useState('ankicode');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email: email.trim(), password: password.trim() });
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__header">
          <h1>Welcome to AnkiCode</h1>
          <p>Log in with your email to review today&apos;s coding drills and keep your spaced repetition schedule on track.</p>
        </div>

        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
            placeholder="demo@ankicode.dev"
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ankicode"
          />
        </label>

        {error && <div className="alert alert--error">{error}</div>}

        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;


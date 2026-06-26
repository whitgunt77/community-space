import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]   = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full
                          bg-forest text-sand text-xl font-display font-bold mb-4 shadow-lg">
            cs
          </div>
          <h1 className="font-display font-bold text-3xl text-night">Join Community Space</h1>
          <p className="text-sm text-night/50 mt-1">Create an account to host and discover local events</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                placeholder="coolneighbor42"
                value={form.username}
                onChange={set('username')}
                minLength={3}
                maxLength={50}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={set('confirm')}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-ember bg-ember/8 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-night/50 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-forest font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
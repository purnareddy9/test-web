import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Login successful
    navigate('/admin');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div className="flex items-center gap-2 mb-8">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <h1 className="text-2xl font-semibold text-white">
          Admin Login
        </h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-white/60 mb-2"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="pwd"
            className="block text-sm text-white/60 mb-2"
          >
            Password
          </label>

          <input
            id="pwd"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/30">
        Portfolio Admin — restricted access
      </p>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    navigate('/admin');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm">
      Admin Login

      Email
      <input id="email" type="email" autoComplete="email" value={email}
        onChange={e => setEmail(e.target.value)}
        className="form-input" placeholder="admin@example.com" />

      Password
      <input id="pwd" type="password" autoComplete="current-password" value={password}
        onChange={e => setPassword(e.target.value)}
        className="form-input" placeholder="••••••••" />

      {error && (
        <div>
          <AlertCircle />
          {error}
        </div>
      )}

      {loading ? 'Signing in…' : 'Sign In'}

      Portfolio Admin — restricted access
    </motion.div>
  );
}

import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack, Alert, CircularProgress } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import { BsPersonPlus } from 'react-icons/bs';

export default function RegisterUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const registerUser = useAppStore((s) => s.registerUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerUser(name, email, password, adminCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: { xs: 4, md: 8 } }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h4" color="primary.main" gutterBottom>Create Account</Typography>
            <Typography color="text.secondary">Join the GST Simulator to save your progress</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                inputProps={{ minLength: 6 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                label="Teacher Invite Code (Optional)"
                fullWidth
                placeholder="Leave blank if you are a student"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !email || !password || !name}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BsPersonPlus size={18} />}
                sx={{ mt: 2, py: 1.5, fontSize: '1rem', borderRadius: 2 }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Typography textAlign="center" variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1a3c6e', fontWeight: 600, textDecoration: 'none' }}>
              Log in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

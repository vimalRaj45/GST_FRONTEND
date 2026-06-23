import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack, Alert, Tabs, Tab } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { BsBoxArrowInRight } from 'react-icons/bs';
import { isOfflineMode } from '../api/client.js';

export default function Login() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Student, 1 = Staff
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const studentLogin = useAppStore((s) => s.studentLogin);

  const isOffline = isOfflineMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 0) {
        await studentLogin(email, inviteCode);
        navigate('/');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '82vh',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: { xs: 4, md: 6 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/login_illustration.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.97)',
          opacity: 0.85,
          zIndex: 0,
        }
      }}
    >
      <Paper
        elevation={6}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: 960,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          minHeight: 520,
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 48px rgba(26, 60, 110, 0.08)',
        }}
      >
        {/* Left column: Illustration (hidden on mobile) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50%',
            bgcolor: 'rgba(26,60,110,0.02)',
            p: 4,
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            component="img"
            src="/login_illustration.png"
            alt="Neon Database Sandbox Workspace"
            sx={{
              width: '100%',
              maxWidth: 360,
              height: 'auto',
              borderRadius: 3,
              boxShadow: '0 12px 24px rgba(26, 60, 110, 0.06)',
              mb: 3
            }}
          />
          <Typography variant="h6" fontWeight={800} color="primary.main" align="center" sx={{ mb: 1 }}>
            Practice GST Compliance
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 320 }}>
            Learn in a realistic, risk-free educational sandbox hosted on Neon Serverless Postgres.
          </Typography>
        </Box>

        {/* Right column: Login form */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" fontWeight={800} gutterBottom>Welcome Back</Typography>
              <Typography color="text.secondary">Access your simulated sandbox or workspace</Typography>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(e, val) => { setActiveTab(val); setError(null); }}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
            >
              <Tab label="Student Login" />
              <Tab label="Staff Login" />
            </Tabs>

            {isOffline && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <strong>Offline Sandbox Active</strong>
                <br />
                You can log in directly. Simply click <strong>Login</strong> (no credentials needed).
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required={!isOffline}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                {activeTab === 0 ? (
                  <TextField
                    label="Student Invite Token"
                    placeholder={isOffline ? "Optional (defaults to Sandbox Token)" : "e.g. INV-XYZ123"}
                    fullWidth
                    required={!isOffline}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                ) : (
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required={!isOffline}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<BsBoxArrowInRight />}
                  sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Stack>
            </form>

            {activeTab === 0 ? (
              <Typography align="center" variant="body2" color="text.secondary">
                Students do not need to register. Simply enter your email and institute invite token above to log in instantly.
              </Typography>
            ) : (
              <Typography align="center" variant="body2" color="text.secondary">
                Need to register a Client profile?{' '}
                <Link to="/register" style={{ color: '#1a3c6e', fontWeight: 600, textDecoration: 'none' }}>
                  Sign Up
                </Link>
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

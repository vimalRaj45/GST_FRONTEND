import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton, Avatar,
  Tooltip, Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Stack, Chip, useMediaQuery, useTheme
} from '@mui/material';
import {
  BsHouseDoor, BsBuilding, BsCalculator, BsReceiptCutoff,
  BsWallet2, BsCalendarCheck, BsPatchQuestion, BsList, BsX,
  BsPersonCircle, BsChevronRight, BsInfoCircle,
  BsLayoutTextSidebarReverse, BsReceipt, BsJournalText, BsMortarboard
} from 'react-icons/bs';

import theme from './theme.js';
import { useAppStore } from './store/useAppStore.js';
import { getBusiness } from './api/client.js';
import TutorWidget from './components/TutorWidget.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import RegisterUser from './pages/RegisterUser.jsx';
import RegisterBusiness from './pages/RegisterBusiness.jsx';
import Calculator from './pages/Calculator.jsx';
import InvoiceNew from './pages/InvoiceNew.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import Ledger from './pages/Ledger.jsx';
import Periods from './pages/Periods.jsx';
import FilingReview from './pages/FilingReview.jsx';
import Quiz from './pages/Quiz.jsx';
import HowToUse from './pages/HowToUse.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const LOGO_URL = 'https://aadhirasolutions-hacakthon.onrender.com/logo.png';

const NAV_ITEMS = [
  { label: 'Overview', path: '/', icon: BsLayoutTextSidebarReverse },
  { label: 'Calculator', path: '/calculator', icon: BsCalculator },
  { label: 'Invoices', path: '/invoices/new', icon: BsReceipt },
  { label: 'ITC Ledger', path: '/ledger', icon: BsJournalText },
  { label: 'Returns', path: '/periods', icon: BsCalendarCheck },
  { label: 'Quiz', path: '/quiz', icon: BsMortarboard },
];

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { business, isAuthenticated, user, logout, setBusiness } = useAppStore();

  const activeRoute = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (isAuthenticated && !business) {
      // Logic to fetch business if needed
    }
  }, [isAuthenticated]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Navbar ── */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, md: 3 }, py: 0.5 }}>
          {/* Hamburger (mobile) */}
          {isMobile && (
            <IconButton color="primary" edge="start" onClick={() => setDrawerOpen(true)} size="large" sx={{ mr: 0.5 }}>
              <BsList size={26} />
            </IconButton>
          )}

          {/* Logo + Brand */}
          <Stack
            direction="row" alignItems="center" spacing={1}
            sx={{ cursor: 'pointer', flexShrink: 0, mr: { xs: 'auto', md: 2 } }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src={LOGO_URL}
              alt="Aadhira Solutions Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
              sx={{ height: 40, width: 40, objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
          </Stack>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeRoute(item.path);
                return (
                  <Button
                    key={item.path}
                    startIcon={<Icon size={16} />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      px: 2, py: 1, borderRadius: 2, color: active ? 'primary.main' : 'text.secondary',
                      bgcolor: active ? 'rgba(26,60,110,0.06)' : 'transparent',
                      fontWeight: active ? 700 : 500, fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: 'rgba(26,60,110,0.04)' },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Auth & Active Business Badge */}
          {isAuthenticated ? (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ml: 'auto' }}>
              {!isMobile && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {user?.name}
                  </Typography>
                </Stack>
              )}
              {user?.role === 'admin' && (
                <Button
                  variant="outlined" size="small" color="error"
                  onClick={() => navigate('/admin')}
                  sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700 }}
                >
                  Admin Panel
                </Button>
              )}
              {business ? (
                <Tooltip title="Your active simulated business">
                  <Chip
                    icon={<BsBuilding size={14} color="#1a3c6e" />}
                    label={isMobile ? business.name.substring(0, 8) + '...' : `${business.name} (${business.state_code})`}
                    variant="outlined"
                    clickable
                    onClick={() => navigate('/')}
                    sx={{
                      fontWeight: 600, borderColor: '#1a3c6e', color: '#1a3c6e',
                      bgcolor: 'rgba(26,60,110,0.04)', px: 0.5,
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              ) : (
                <Button
                  variant="contained" size="medium" color="primary"
                  onClick={() => navigate('/register-business')}
                  sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Create Business
                </Button>
              )}
              <Button size="small" onClick={handleLogout} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                Logout
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 'auto' }}>
              <Button size="small" onClick={() => navigate('/login')} sx={{ fontWeight: 600 }}>Login</Button>
              <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ fontWeight: 600, boxShadow: 'none' }}>Sign Up</Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ background: 'linear-gradient(180deg,#1a3c6e 0%,#2d5fa0 100%)', p: 2.5, color: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={800}>Aadhira Solutions</Typography>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }} size="small">
              <BsX size={20} />
            </IconButton>
          </Stack>
          {isAuthenticated && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Logged in as</Typography>
              <Typography fontWeight={700} fontSize="0.85rem">{user?.name}</Typography>
            </Box>
          )}
          {business && (
            <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Active Business</Typography>
              <Typography fontWeight={700} fontSize="0.85rem">{business.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>{business.gstin}</Typography>
            </Box>
          )}
        </Box>

        <List sx={{ pt: 1 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeRoute(item.path);
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={active}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  sx={{
                    mx: 1, borderRadius: 2, mb: 0.25,
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '& *': { color: 'white' } },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon size={18} color={active ? '#1a3c6e' : '#666'} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 400 }} />
                  {active && <BsChevronRight size={14} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 Aadhira Solutions. Educational use only.
          </Typography>
        </Box>
      </Drawer>

      {/* ── Main Content ── */}
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
          {children}
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box
        component="footer"
        sx={{
          py: { xs: 1.5, md: 2 }, px: { xs: 2, md: 3 },
          background: 'linear-gradient(135deg,#1a3c6e,#2d5fa0)',
          color: 'rgba(255,255,255,0.75)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              component="img" src={LOGO_URL} alt="Aadhira"
              sx={{ height: 26, objectFit: 'contain', borderRadius: 1 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="caption" fontWeight={600}>Aadhira Solutions</Typography>
          </Stack>
          <Typography variant="caption" textAlign="center" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BsInfoCircle size={12} /> GST Learning Simulator — For Educational Use Only · Not a legal filing tool
          </Typography>
        </Stack>
      </Box>

      <TutorWidget />
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/"                element={<Home />} />
                <Route path="/how-to-use"      element={<HowToUse />} />
                <Route path="/login"           element={<Login />} />
                <Route path="/register"        element={<RegisterUser />} />
                <Route path="/register-business" element={<RegisterBusiness />} />
                <Route path="/calculator"      element={<Calculator />} />
                <Route path="/invoices/new"    element={<InvoiceNew />} />
                <Route path="/invoices/:id"    element={<InvoiceView />} />
                <Route path="/ledger"          element={<Ledger />} />
                <Route path="/periods"         element={<Periods />} />
                <Route path="/periods/:id/file" element={<FilingReview />} />
                <Route path="/quiz"            element={<Quiz />} />
                <Route path="/admin"           element={<AdminDashboard />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

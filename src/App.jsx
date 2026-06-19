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
  BsPersonCircle, BsChevronRight, BsInfoCircle
} from 'react-icons/bs';

import theme from './theme.js';
import { useAppStore } from './store/useAppStore.js';
import { getBusiness } from './api/client.js';
import TutorWidget from './components/TutorWidget.jsx';

import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Calculator from './pages/Calculator.jsx';
import InvoiceNew from './pages/InvoiceNew.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import Ledger from './pages/Ledger.jsx';
import Periods from './pages/Periods.jsx';
import FilingReview from './pages/FilingReview.jsx';
import Quiz from './pages/Quiz.jsx';
import HowToUse from './pages/HowToUse.jsx';

const LOGO_URL = 'https://aadhirasolutions-hacakthon.onrender.com/logo.png';

const NAV_ITEMS = [
  { label: 'Home',        path: '/',             icon: BsHouseDoor },
  { label: 'How To Use',  path: '/how-to-use',   icon: BsPatchQuestion },
  { label: 'Register',    path: '/register',     icon: BsBuilding },
  { label: 'Calculator',  path: '/calculator',   icon: BsCalculator },
  { label: 'New Invoice', path: '/invoices/new', icon: BsReceiptCutoff },
  { label: 'ITC Ledger',  path: '/ledger',       icon: BsWallet2 },
  { label: 'Tax Periods', path: '/periods',      icon: BsCalendarCheck },
  { label: 'Quiz',        path: '/quiz',         icon: BsPatchQuestion },
];

function Layout({ children }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const muiTheme    = useTheme();
  const isMobile    = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { business, businessId, setBusiness } = useAppStore();

  useEffect(() => {
    if (businessId && !business) {
      getBusiness(businessId).then(setBusiness).catch(() => {});
    }
  }, [businessId]);

  const activeRoute = (path) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── AppBar ── */}
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        color: 'text.primary',
        zIndex: 1200
      }}>
        <Toolbar sx={{ gap: 1, px: { xs: 1.5, md: 3 }, py: 0.5 }}>
          {/* Hamburger (mobile) */}
          {isMobile && (
            <IconButton color="primary" edge="start" onClick={() => setDrawerOpen(true)} size="large" sx={{ mr: 0.5 }}>
              <BsList size={26} />
            </IconButton>
          )}

          {/* Logo + Brand */}
          <Stack
            direction="row" alignItems="center" spacing={1.5}
            sx={{ cursor: 'pointer', flexShrink: 0, mr: { xs: 'auto', md: 4 } }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src={LOGO_URL}
              alt="Aadhira Solutions Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
              sx={{ height: 48, width: 48, objectFit: 'contain', mixBlendMode: 'multiply', alignSelf: 'center', ml: -1 }}
            />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" color="primary.main" lineHeight={1.1} sx={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                Aadhira Solutions
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                GST Learning Simulator
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography variant="subtitle1" color="primary.main" fontWeight={800}>Aadhira GST</Typography>
            </Box>
          </Stack>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeRoute(item.path);
                return (
                  <Button
                    key={item.path}
                    color={active ? 'primary' : 'inherit'}
                    onClick={() => navigate(item.path)}
                    startIcon={<Icon size={16} />}
                    sx={{
                      fontSize: '0.85rem',
                      px: 2,
                      py: 1,
                      minWidth: 'unset',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'primary.main' : 'text.secondary',
                      borderRadius: 3,
                      bgcolor: active ? 'rgba(26,60,110,0.08)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(26,60,110,0.05)', color: 'primary.main' },
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Business badge / Register CTA */}
          {business ? (
            <Tooltip title={`GSTIN: ${business.gstin} | ${business.state}`} arrow>
              <Chip
                label={isMobile ? business.name.split(' ')[0] : business.name}
                icon={<BsPersonCircle size={15} style={{ marginLeft: 8 }} />}
                size="medium"
                color="primary"
                sx={{
                  maxWidth: { xs: 120, md: 200 },
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(26,60,110,0.2)',
                  '& .MuiChip-label': { fontSize: '0.8rem' },
                  flexShrink: 0,
                }}
              />
            </Tooltip>
          ) : (
            <Button
              variant="contained" size="medium" color="primary"
              startIcon={<BsBuilding size={14} />}
              onClick={() => navigate('/register')}
              sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 4px 12px rgba(26,60,110,0.25)' }}
            >
              {isMobile ? 'Register' : 'Register Business'}
            </Button>
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img" src={LOGO_URL} alt="Logo"
                sx={{ height: 38, width: 38, objectFit: 'contain', borderRadius: 1.5, alignSelf: 'center' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box>
                <Typography fontWeight={800} fontSize="0.95rem">Aadhira Solutions</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>GST Learning Simulator</Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }} size="small">
              <BsX size={20} />
            </IconButton>
          </Stack>
          {business && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
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
            <BsInfoCircle size={12} /> GST Learning Simulator — For Educational Use Only · Not a legal filing tool · No real APIs
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
                <Route path="/register"        element={<Register />} />
                <Route path="/calculator"      element={<Calculator />} />
                <Route path="/invoices/new"    element={<InvoiceNew />} />
                <Route path="/invoices/:id"    element={<InvoiceView />} />
                <Route path="/ledger"          element={<Ledger />} />
                <Route path="/periods"         element={<Periods />} />
                <Route path="/periods/:id/file" element={<FilingReview />} />
                <Route path="/quiz"            element={<Quiz />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

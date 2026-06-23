import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster, toast } from 'react-hot-toast';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton, Avatar,
  Tooltip, Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Stack, Chip, useMediaQuery, useTheme
} from '@mui/material';
import {
  BsBuilding, BsCalculator,
  BsCalendarCheck, BsList, BsX,
  BsPersonCircle, BsChevronRight, BsInfoCircle,
  BsLayoutTextSidebarReverse, BsReceipt, BsJournalText, BsMortarboard,
  BsCardList, BsTrophy, BsBoxSeam
} from 'react-icons/bs';

import theme from './theme.js';
import { useAppStore } from './store/useAppStore.js';
import { getBusiness, isOfflineMode } from './api/client.js';
import TutorWidget from './components/TutorWidget.jsx';
import GuidedLearning from './components/GuidedLearning.jsx';
import GuideBanner from './components/GuideBanner.jsx';
import { useGuideStore } from './store/useGuideStore.js';
import SplashScreen from './components/SplashScreen.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import RegisterUser from './pages/RegisterUser.jsx';
import RegisterBusiness from './pages/RegisterBusiness.jsx';
import Calculator from './pages/Calculator.jsx';
import InvoiceNew from './pages/InvoiceNew.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import SellInvoice from './pages/SellInvoice.jsx';
import PurchaseInvoice from './pages/PurchaseInvoice.jsx';
import Ledger from './pages/Ledger.jsx';
import Periods from './pages/Periods.jsx';
import FilingReview from './pages/FilingReview.jsx';
import Quiz from './pages/Quiz.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Gstr1View from './pages/Gstr1View.jsx';
import HsnExplorer from './pages/HsnExplorer.jsx';
import EWayBill from './pages/EWayBill.jsx';
import Progress from './pages/Progress.jsx';
import Inventory from './pages/Inventory.jsx';

const LOGO_URL = '/logo.png';

const NAV_ITEMS = [
  { label: 'Overview',    path: '/',               icon: BsLayoutTextSidebarReverse },
  { label: 'Calculator',  path: '/calculator',     icon: BsCalculator },
  { label: 'Inventory',   path: '/inventory',      icon: BsBoxSeam },
  { label: 'Invoices',    path: '/invoices/sell',  icon: BsReceipt },
  { label: 'ITC Ledger',  path: '/ledger',         icon: BsJournalText },
  { label: 'Returns',     path: '/periods',        icon: BsCalendarCheck },
  { label: 'HSN Codes',   path: '/hsn-explorer',   icon: BsCardList },
  { label: 'Quiz',        path: '/quiz',           icon: BsMortarboard },
  { label: 'Progress',    path: '/progress',       icon: BsTrophy },
];

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { business, isAuthenticated, user, logout, setBusiness, loadUser } = useAppStore();
  const { active: guideActive } = useGuideStore();

  const activeRoute = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };



  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated, loadUser]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, px: { xs: 2, sm: 2, md: 3 }, py: 0.5 }}>
          {/* Hamburger (mobile) */}
          {isMobile && isAuthenticated && (
            <IconButton color="primary" onClick={() => setDrawerOpen(true)} sx={{ mr: 0, ml: { xs: 0.5, sm: 0 }, p: 0.5 }}>
              <BsList size={28} />
            </IconButton>
          )}

          {/* Logo + Brand */}
          <Stack
            direction="row"
            spacing={{ xs: 0, sm: 1.5 }}
            sx={{ cursor: 'pointer', flexShrink: 0, mr: { xs: 'auto', lg: 3 }, alignItems: 'center' }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src={LOGO_URL}
              alt="Aadhira Solutions Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
              sx={{ 
                height: { xs: 45, sm: 65, md: 75 }, 
                width: { xs: 45, sm: 65, md: 75 }, 
                objectFit: 'contain', 
                mixBlendMode: 'multiply',
                ml: { xs: -0.5, sm: 0 },
                mr: { xs: -0.5, sm: 0 }
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.1rem', md: '1.25rem' },
                letterSpacing: '-0.02em',
                color: '#1a3c6e',
                whiteSpace: 'nowrap',
              }}
            >
              {isSmallScreen ? "Aadhira" : "Aadhira Solutions"}
            </Typography>
          </Stack>

          {/* Desktop Nav Links */}
          {!isMobile && isAuthenticated && user?.role === 'student' && (
            <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeRoute(item.path);
                return (
                  <Tooltip title={item.label} key={item.path} arrow>
                    <Button
                      onClick={() => navigate(item.path)}
                      sx={{
                        px: { xs: 1, xl: 1.5 }, py: 0.75, borderRadius: 2, color: active ? 'primary.main' : 'text.secondary',
                        bgcolor: active ? 'rgba(26,60,110,0.06)' : 'transparent',
                        fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        minWidth: { xs: 'auto', xl: '64px' },
                        '&:hover': { bgcolor: 'rgba(26,60,110,0.04)' },
                      }}
                    >
                      <Icon size={15} />
                      <Box component="span" sx={{ display: { xs: 'none', xl: 'inline' }, ml: 0.75 }}>
                        {item.label}
                      </Box>
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>
          )}

          {/* Auth Badge */}
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} sx={{ ml: 'auto', alignItems: 'center' }}>
            {isAuthenticated ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {!isMobile && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', xl: 'block' } }}>
                      {user?.name}
                    </Typography>
                  </Stack>
                )}
                {!isSmallScreen && ['admin', 'super_admin', 'client'].includes(user?.role) && (
                  <Button
                    variant="outlined" size="small" color="error"
                    onClick={() => navigate('/admin')}
                    sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 700, py: 0.5, px: 1.5 }}
                  >
                    Admin Panel
                  </Button>
                )}
                {user?.role === 'student' && (business ? (
                  <Tooltip title={`Active Business: ${business.name} (${business.state})`}>
                    <Chip
                      icon={<BsBuilding size={14} color="#1a3c6e" />}
                      label={business.name.length > (isSmallScreen ? 6 : 12) ? business.name.substring(0, isSmallScreen ? 6 : 12) + '...' : business.name}
                      variant="outlined"
                      clickable
                      onClick={() => navigate('/register-business')}
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
                    sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, py: 0.5, px: 1.5 }}
                  >
                    Select Business
                  </Button>
                ))}
                {/* Logout – show inline only on desktop; on mobile it lives in the drawer */}
                <Button
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    minWidth: 'auto',
                    color: 'text.secondary',
                    py: 0.5, px: 1.5,
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Logout
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button size="small" onClick={() => navigate('/login')} sx={{ fontWeight: 600, py: 0.5, px: 1.5 }}>Login</Button>
                <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ fontWeight: 600, boxShadow: 'none', py: 0.5, px: 1.5 }}>Sign Up</Button>
              </Stack>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        <Box sx={{ bgcolor: '#1a3c6e', p: 2.5, color: 'white' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
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
          {user?.role === 'student' ? (
            NAV_ITEMS.map((item) => {
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
                    <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: active ? 700 : 400 }}>{item.label}</Typography>} />
                    {active && <BsChevronRight size={14} />}
                  </ListItemButton>
                </ListItem>
              );
            })
          ) : (
            ['admin', 'super_admin', 'client'].includes(user?.role) && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={activeRoute('/admin')}
                  onClick={() => { navigate('/admin'); setDrawerOpen(false); }}
                  sx={{
                    mx: 1, borderRadius: 2, mb: 0.25,
                    '&.Mui-selected': { bgcolor: 'error.main', color: 'white', '& *': { color: 'white' } },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BsPersonCircle size={18} color={activeRoute('/admin') ? '#fff' : '#666'} />
                  </ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>Admin Panel</Typography>} />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>

        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
          {isAuthenticated && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={() => { handleLogout(); setDrawerOpen(false); }}
              sx={{ mb: 1.5, fontWeight: 700, borderRadius: 2 }}
            >
              Logout
            </Button>
          )}
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
          bgcolor: '#1a3c6e',
          color: 'rgba(255,255,255,0.75)',
          mb: guideActive ? '44px' : 0,
          transition: 'margin-bottom 0.3s'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              component="img" src={LOGO_URL} alt="Aadhira"
              sx={{ height: 26, objectFit: 'contain', borderRadius: 1 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="caption" fontWeight={600}>Aadhira Solutions</Typography>
          </Stack>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textAlign: 'center' }}>
            <BsInfoCircle size={12} /> GST Learning Simulator — For Educational Use Only · Not a legal filing tool
          </Typography>
        </Stack>
      </Box>

      {isAuthenticated && user?.role === 'student' && (
        <>
          {!guideActive && <TutorWidget />}
          {!guideActive && <GuidedLearning />}
          <GuideBanner />
        </>
      )}
    </Box>
  );
}

function StudentGuard({ children }) {
  const { user, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      if (location.pathname !== '/') {
        navigate('/login');
      }
    } else if (user && user.role !== 'student') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  if (!isAuthenticated) {
    if (location.pathname !== '/') {
      return null;
    }
  } else if (user && user.role !== 'student') {
    return null;
  }
  return children;
}

function AdminGuard({ children }) {
  const { user, isAuthenticated } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'student') {
      navigate('/');
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || (user && user.role === 'student')) {
    return null;
  }
  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per browser session
    const seen = sessionStorage.getItem('splash_shown');
    if (seen) return false;
    sessionStorage.setItem('splash_shown', '1');
    return true;
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', fontFamily: 'Outfit, sans-serif' } }} />
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/"                  element={<StudentGuard><Home /></StudentGuard>} />
                <Route path="/login"             element={<Login />} />
                <Route path="/register"          element={<RegisterUser />} />
                <Route path="/register-business" element={<StudentGuard><RegisterBusiness /></StudentGuard>} />
                <Route path="/calculator"        element={<StudentGuard><Calculator /></StudentGuard>} />
                <Route path="/inventory"         element={<StudentGuard><Inventory /></StudentGuard>} />
                <Route path="/invoices/new"      element={<StudentGuard><InvoiceNew /></StudentGuard>} />
                <Route path="/invoices/sell"     element={<StudentGuard><SellInvoice /></StudentGuard>} />
                <Route path="/invoices/purchase" element={<StudentGuard><PurchaseInvoice /></StudentGuard>} />
                <Route path="/invoices/:id"      element={<StudentGuard><InvoiceView /></StudentGuard>} />
                <Route path="/ledger"            element={<StudentGuard><Ledger /></StudentGuard>} />
                <Route path="/periods"           element={<StudentGuard><Periods /></StudentGuard>} />
                <Route path="/periods/:id/file"  element={<StudentGuard><FilingReview /></StudentGuard>} />
                <Route path="/periods/:id/gstr1" element={<StudentGuard><Gstr1View /></StudentGuard>} />
                <Route path="/hsn-explorer"      element={<StudentGuard><HsnExplorer /></StudentGuard>} />
                <Route path="/ewaybill"          element={<StudentGuard><EWayBill /></StudentGuard>} />
                <Route path="/quiz"              element={<StudentGuard><Quiz /></StudentGuard>} />
                <Route path="/progress"          element={<StudentGuard><Progress /></StudentGuard>} />
                <Route path="/admin"             element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

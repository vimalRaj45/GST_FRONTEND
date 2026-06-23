import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Stack, Chip, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import {
  BsBuilding, BsReceiptCutoff, BsWallet2, BsClipboardCheck,
  BsCalculator, BsPatchQuestion, BsCalendarCheck, BsArrowRight,
  BsShieldCheck, BsGraphUp, BsCurrencyRupee, BsInfoCircle,
  BsBoxArrowRight, BsGeoAlt, BsBriefcase, BsTag, BsDownload
} from 'react-icons/bs';

const LOGO_URL = '/logo.png';

const concepts = [
  {
    icon: <BsBuilding size={32} color="#1a3c6e" />,
    title: 'GSTIN Registration',
    desc: 'Every business above the turnover threshold gets a 15-digit GSTIN — a unique GST identity number based on state code + PAN.',
  },
  {
    icon: <BsReceiptCutoff size={32} color="#2563eb" />,
    title: 'Tax Invoices',
    desc: 'When you sell, issue a Tax Invoice with taxable value + CGST/SGST (intra-state) or IGST (inter-state).',
  },
  {
    icon: <BsWallet2 size={32} color="#1e40af" />,
    title: 'Input Tax Credit (ITC)',
    desc: 'Input Tax Credit (ITC) is the credit of GST paid on business purchases, which can be used to reduce the GST payable on sales.',
  },
  {
    icon: <BsClipboardCheck size={32} color="#0288d1" />,
    title: 'Monthly Returns',
    desc: 'File GSTR-1 (outward supplies) and GSTR-3B (net tax summary) every month. Late filing attracts interest + penalty.',
  },
];

const taxSlabs = [
  { rate: '0%',  example: 'Fresh milk, wheat, books',                          bg: '#f8fafc', color: '#475569' },
  { rate: '5%',  example: 'Packed food, medicines',                            bg: '#eff6ff', color: '#3b82f6' },
  { rate: '18%', example: 'IT services, restaurants, TVs',                     bg: '#eff6ff', color: '#1d4ed8' },
  { rate: '40%', example: 'Luxury and sin goods (e.g., tobacco products, certain luxury items)', bg: '#fef2f2', color: '#991b1b' },
];

const features = [
  { icon: <BsShieldCheck size={20} />, text: 'No real GST filing — 100% safe sandbox' },
  { icon: <BsGraphUp size={20} />,     text: 'AI-powered explanations via Mistral' },
  { icon: <BsCurrencyRupee size={20}/>,text: 'Real GST math: CGST, SGST, IGST' },
  { icon: <BsInfoCircle size={20} />,  text: 'ITC matching, period filing, penalties' },
];

export default function Home() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  return (
    <Box>
      {/* ── Student Profile & Active Business Detail ── */}
      {isAuthenticated && user?.role === 'student' && (
        <Card sx={{ mb: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Grid container>
            {/* Profile Info */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.25rem' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#1a3c6e" sx={{ lineHeight: 1.2 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Chip label="Student Workspace" size="small" color="primary" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                </Box>
              </Stack>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<BsBoxArrowRight />}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                sx={{ alignSelf: 'flex-start', fontWeight: 700, mt: 1 }}
              >
                Logout
              </Button>
            </Grid>

            {/* Business Details */}
            <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, borderLeft: { md: '1px solid' }, borderTop: { xs: '1px solid', md: 'none' }, borderColor: 'divider' }}>
              {business ? (
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em' }}>
                    Active Simulated Business
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#1a3c6e" sx={{ mt: 0.5, mb: 2 }}>
                    {business.name}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BsTag color="#2563eb" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">GSTIN</Typography>
                          <Typography variant="body2" fontWeight={600}>{business.gstin}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BsGeoAlt color="#2563eb" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                          <Typography variant="body2" fontWeight={600}>{business.state} ({business.state_code})</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BsBriefcase color="#2563eb" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Tax Scheme</Typography>
                          <Box sx={{ mt: 0.25 }}>
                            <Chip 
                              label={business.scheme_type === 'regular' ? 'Regular Scheme' : 'Composition Scheme'} 
                              size="small" 
                              color={business.scheme_type === 'regular' ? 'info' : 'warning'}
                              sx={{ fontWeight: 700, fontSize: '0.75rem' }} 
                            />
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', py: 2 }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
                    No active business scenario claimed yet.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/register-business')}
                    sx={{ fontWeight: 700 }}
                  >
                    Select Business Scenario
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>
      )}

      {/* ── Hero ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1a3c6e 100%)',
          color: 'white',
          borderRadius: { xs: 2, md: 2 },
          p: { xs: 4, sm: 5, md: 8 },
          mb: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(30, 58, 138, 0.25)',
          '&::before': {
            content: '""', position: 'absolute', top: -150, right: -100,
            width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)',
          },
          '&::after': {
            content: '""', position: 'absolute', bottom: -100, left: -100,
            width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(0,0,0,0) 70%)',
          },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
          <Box
            component="img" src={LOGO_URL} alt="Aadhira Solutions"
            sx={{ height: { xs: 52, md: 72 }, borderRadius: 2, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Box>
            <Chip label="Aadhira Solutions" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }} />
            <Chip label="Educational Sandbox" size="small" color="secondary" sx={{ ml: 1, fontSize: '0.75rem', fontWeight: 700, mb: 0.5, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }} />
          </Box>
        </Stack>

        <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.8rem' }, lineHeight: 1.1, position: 'relative', zIndex: 1 }}>
          India's <span style={{ color: '#60a5fa' }}>GST</span> Learning Simulator
        </Typography>
        <Typography sx={{ mb: 4, color: '#cbd5e1', maxWidth: 650, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.6, position: 'relative', zIndex: 1, fontWeight: 400 }}>
          Master the Goods & Services Tax by running your own simulated business.
          Register, create invoices, track input tax credits, and file returns — all in a risk-free, AI-powered sandbox.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: { xs: 2, md: 4 }, mb: 3 }}>
          <Button
            variant="contained" size="large" color="secondary"
            endIcon={<BsArrowRight />}
            onClick={() => navigate(business ? '/invoices/new' : '/register-business')}
            sx={{
              py: { xs: 1.5, md: 2 }, px: { xs: 4, md: 5 },
              fontSize: { xs: '1rem', md: '1.1rem' }, borderRadius: 3,
              boxShadow: '0 8px 24px rgba(26,60,110,0.3)',
            }}
          >
            {business ? 'Manage Invoices' : 'Choose Your Business'}
          </Button>

          {deferredPrompt && (
            <Button
              variant="outlined" size="large"
              startIcon={<BsDownload />}
              onClick={handleInstallApp}
              sx={{
                py: { xs: 1.5, md: 2 }, px: { xs: 4, md: 5 },
                fontSize: { xs: '1rem', md: '1.1rem' }, borderRadius: 3,
                borderColor: 'rgba(255,255,255,0.5)', color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Download App
            </Button>
          )}
        </Stack>

        {/* Feature badges */}
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {features.map(({ icon, text }) => (
            <Grid size={{ xs: 12, sm: 6 }} key={text}>
              <Stack direction="row" spacing={1.5}
                sx={{ alignItems: 'center', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 10, px: 2, py: 1.25, height: '100%' }}>
                <Box sx={{ opacity: 0.85, display: 'flex', alignItems: 'center' }}>{icon}</Box>
                <Typography sx={{ opacity: 0.9, fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.3 }}>{text}</Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Key Concepts ── */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography variant="h3" sx={{ mb: 3, fontSize: { xs: '1.5rem', md: '2rem' }, textAlign: 'center' }}>Key GST Concepts</Typography>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {concepts.map((c) => (
            <Grid size={{ xs: 12, sm: 6 }} key={c.title}>
              <Card sx={{ height: '100%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(15,23,42,0.08)', borderColor: 'primary.light' } }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ mb: 2, p: 1.5, display: 'inline-flex', borderRadius: 2, bgcolor: 'background.default' }}>{c.icon}</Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, fontSize: '1.1rem', color: 'text.primary' }}>{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{c.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Tax Slabs ── */}
      <Card sx={{ mb: { xs: 5, md: 7 }, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 4, justifyContent: 'center' }}>
            <Box sx={{ bgcolor: 'rgba(26,60,110,0.1)', p: 1, borderRadius: 2 }}><BsCurrencyRupee size={24} color="#1a3c6e" /></Box>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Official GST Tax Slabs</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            {taxSlabs.map((slab) => (
              <Box key={slab.rate} sx={{ 
                p: { xs: 2, md: 3 }, borderRadius: 2, textAlign: 'center', 
                bgcolor: slab.bg, border: `1px solid ${slab.color}30`,
                boxShadow: `0 8px 24px ${slab.color}15`,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' },
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}>
                <Typography variant="h2" sx={{ color: slab.color, fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1 }}>
                  {slab.rate}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block', fontWeight: 500, fontSize: '0.8rem' }}>
                  {slab.example}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

    </Box>
  );
}

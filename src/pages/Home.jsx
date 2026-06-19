import React from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Divider, Stack, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  BsBuilding, BsReceiptCutoff, BsWallet2, BsClipboardCheck,
  BsCalculator, BsPatchQuestion, BsCalendarCheck, BsArrowRight,
  BsShieldCheck, BsGraphUp, BsCurrencyRupee, BsInfoCircle
} from 'react-icons/bs';

const LOGO_URL = 'https://aadhirasolutions-hacakthon.onrender.com/logo.png';

const concepts = [
  {
    icon: <BsBuilding size={32} color="#1a3c6e" />,
    title: 'GSTIN Registration',
    desc: 'Every business above the turnover threshold gets a 15-digit GSTIN — a unique GST identity number based on state code + PAN.',
  },
  {
    icon: <BsReceiptCutoff size={32} color="#e07b00" />,
    title: 'Tax Invoices',
    desc: 'When you sell, issue a Tax Invoice with taxable value + CGST/SGST (intra-state) or IGST (inter-state).',
  },
  {
    icon: <BsWallet2 size={32} color="#2e7d32" />,
    title: 'Input Tax Credit (ITC)',
    desc: 'GST you pay on purchases offsets GST you collect on sales. You remit only the net difference to the government.',
  },
  {
    icon: <BsClipboardCheck size={32} color="#0288d1" />,
    title: 'Monthly Returns',
    desc: 'File GSTR-1 (outward supplies) and GSTR-3B (net tax summary) every month. Late filing attracts interest + penalty.',
  },
];

const taxSlabs = [
  { rate: '0%',  example: 'Fresh milk, wheat, books',        bg: '#e8f5e9', color: '#2e7d32' },
  { rate: '5%',  example: 'Packed food, medicines',          bg: '#e3f2fd', color: '#1565c0' },
  { rate: '12%', example: 'Computers, mobiles, biscuits',    bg: '#fff8e1', color: '#f57f17' },
  { rate: '18%', example: 'IT services, restaurants, TVs',   bg: '#fce4ec', color: '#c62828' },
  { rate: '28%', example: 'Cars, ACs, tobacco, luxury goods', bg: '#f3e5f5', color: '#6a1b9a' },
];

const features = [
  { icon: <BsShieldCheck size={20} />, text: 'No real GST filing — 100% safe sandbox' },
  { icon: <BsGraphUp size={20} />,     text: 'AI-powered explanations via Mistral' },
  { icon: <BsCurrencyRupee size={20}/>,text: 'Real GST math: CGST, SGST, IGST' },
  { icon: <BsInfoCircle size={20} />,  text: 'ITC matching, period filing, penalties' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <Box>
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
            width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(0,0,0,0) 70%)',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
          <Box
            component="img" src={LOGO_URL} alt="Aadhira Solutions"
            sx={{ height: { xs: 52, md: 72 }, borderRadius: 2, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Box>
            <Chip label="Aadhira Solutions" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }} />
            <Chip label="Educational Sandbox" size="small" color="secondary" sx={{ ml: 1, fontSize: '0.75rem', fontWeight: 700, mb: 0.5, boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }} />
          </Box>
        </Stack>

        <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.8rem' }, lineHeight: 1.1, position: 'relative', zIndex: 1 }}>
          India's <span style={{ color: '#60a5fa' }}>GST</span> Learning Simulator
        </Typography>
        <Typography sx={{ mb: 4, color: '#cbd5e1', maxWidth: 650, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.6, position: 'relative', zIndex: 1, fontWeight: 400 }}>
          Master the Goods & Services Tax by running your own simulated business.
          Register, create invoices, track input tax credits, and file returns — all in a risk-free, AI-powered sandbox.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained" size="large" color="secondary"
            endIcon={<BsArrowRight />}
            onClick={() => navigate('/register-business')}
            sx={{
              mt: { xs: 2, md: 4 }, py: { xs: 1.5, md: 2 }, px: { xs: 4, md: 5 },
              fontSize: { xs: '1rem', md: '1.1rem' }, borderRadius: 3,
              boxShadow: '0 8px 24px rgba(26,60,110,0.3)',
            }}
          >
            Create Your Business
          </Button>
        </Stack>

        {/* Feature badges */}
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {features.map(({ icon, text }) => (
            <Grid item xs={12} sm={6} key={text}>
              <Stack direction="row" alignItems="center" spacing={1.5}
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 10, px: 2, py: 1.25, height: '100%' }}>
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
            <Grid item xs={12} sm={6} key={c.title}>
              <Card sx={{ height: '100%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(15,23,42,0.08)', borderColor: 'primary.light' } }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ mb: 2, p: 1.5, display: 'inline-flex', borderRadius: 2, bgcolor: 'background.default' }}>{c.icon}</Box>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, fontSize: '1.1rem', color: 'text.primary' }}>{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{c.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Tax Slabs ── */}
      <Card sx={{ mb: { xs: 5, md: 7 }, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4, justifyContent: 'center' }}>
            <Box sx={{ bgcolor: 'rgba(26,60,110,0.1)', p: 1, borderRadius: 2 }}><BsCurrencyRupee size={24} color="#1a3c6e" /></Box>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Official GST Tax Slabs</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2.5 }}>
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

      {/* ── Quick Nav ── */}
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant="h3" sx={{ mb: 3, fontSize: { xs: '1.5rem', md: '2rem' }, textAlign: 'center' }}>Quick Actions</Typography>
        <Grid container spacing={2.5}>
          {[
            { label: 'Create Invoice', icon: <BsReceiptCutoff size={22}/>, path: '/invoices/new', color: 'primary' },
            { label: 'View ITC Ledger', icon: <BsWallet2 size={22}/>, path: '/ledger', color: 'secondary' },
            { label: 'Tax Periods', icon: <BsCalendarCheck size={22}/>, path: '/periods', color: 'primary' },
            { label: 'GST Quiz', icon: <BsPatchQuestion size={22}/>, path: '/quiz', color: 'secondary' },
          ].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Button
                fullWidth variant="outlined" color={item.color} size="large"
                startIcon={item.icon}
                endIcon={<BsArrowRight size={16} />}
                onClick={() => navigate(item.path)}
                sx={{ 
                  py: { xs: 1.5, md: 2 }, justifyContent: 'space-between', px: 2.5, 
                  borderRadius: 2, fontSize: '0.95rem',
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: `${item.color}.main`, color: 'white', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }
                }}
              >
                {item.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

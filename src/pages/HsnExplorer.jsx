import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, Card, CardContent, Grid, Stack, Chip,
  InputAdornment, CircularProgress, Alert, Accordion, AccordionSummary,
  AccordionDetails, Divider, Button, Tab, Tabs
} from '@mui/material';
import { BsSearch, BsCardList, BsChevronDown, BsInfoCircle, BsArrowRight } from 'react-icons/bs';
import { getHsnCodes } from '../api/client.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import useProgressStore from '../store/useProgressStore.js';

const HSN_CATEGORIES = [
  { label: 'Food & Agriculture', icon: '🌾', examples: ['Rice', 'Wheat', 'Milk', 'Vegetables', 'Sugar'], color: '#2e7d32' },
  { label: 'Electronics & IT', icon: '💻', examples: ['Laptops', 'Mobiles', 'Cables', 'Monitors', 'Cameras'], color: '#1565c0' },
  { label: 'Textiles & Clothing', icon: '👕', examples: ['Fabrics', 'Garments', 'Yarn', 'Silk', 'Leather'], color: '#c62828' },
  { label: 'Pharmaceuticals', icon: '💊', examples: ['Medicines', 'Surgical gloves', 'Bandages', 'Vaccines'], color: '#0288d1' },
  { label: 'Chemicals', icon: '⚗️', examples: ['Fertilizers', 'Plastics', 'Paints', 'Cleaning agents'], color: '#6a1b9a' },
  { label: 'Vehicles & Parts', icon: '🚗', examples: ['Cars', 'Motorcycles', 'Spare parts', 'Tyres'], color: '#e65100' },
  { label: 'Services (SAC)', icon: '🛠️', examples: ['IT Services', 'Construction', 'Banking', 'Insurance'], color: '#37474f' },
];

const HSN_STRUCTURE = [
  { level: '2-digit', example: '09', desc: 'Chapter — Coffee, Tea, Maté and Spices' },
  { level: '4-digit', example: '0901', desc: 'Heading — Coffee, roasted or not' },
  { level: '6-digit', example: '090111', desc: 'Sub-heading — Roasted, not decaffeinated' },
  { level: '8-digit', example: '09011100', desc: 'Tariff Item — Exact product specification' },
];

const RATE_COLORS = { '0%': '#2e7d32', '5%': '#1565c0', '12%': '#f57f17', '18%': '#c62828', '28%': '#6a1b9a' };

function RateBadge({ rate }) {
  const color = RATE_COLORS[rate] || '#666';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4,
      borderRadius: 10, bgcolor: `${color}15`, border: `1.5px solid ${color}50`,
      color, fontWeight: 800, fontSize: '0.78rem',
    }}>
      {rate} GST
    </Box>
  );
}

export default function HsnExplorer() {
  const [search, setSearch] = useState('');
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const { markModule } = useProgressStore();

  useEffect(() => { markModule('exploredHsn'); }, []);

  const fetchCodes = async (q) => {
    setLoading(true); setError(null);
    try {
      const data = await getHsnCodes(q);
      setCodes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes('');
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCodes(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const byRate = useMemo(() => {
    const map = {};
    codes.forEach((c) => {
      const rate = `${c.rate || 0}%`;
      if (!map[rate]) map[rate] = [];
      map[rate].push(c);
    });
    return map;
  }, [codes]);

  return (
    <Box maxWidth={1000} mx="auto">
      <ExplainerCallout title="What are HSN & SAC Codes?">
        <strong>HSN</strong> (Harmonized System of Nomenclature) is an internationally recognized 8-digit code for classifying <strong>goods</strong>.
        <strong> SAC</strong> (Services Accounting Code) classifies <strong>services</strong>. Every GST invoice must mention the correct code.
        The code determines the applicable tax rate.
      </ExplainerCallout>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BsCardList size={26} color="#1a3c6e" />
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.8rem' } }}>
            HSN / SAC Code Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary">Search and learn about GST classification codes</Typography>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Search Codes" sx={{ fontWeight: 600 }} />
          <Tab label="By Tax Rate" sx={{ fontWeight: 600 }} />
          <Tab label="HSN Structure" sx={{ fontWeight: 600 }} />
          <Tab label="Categories" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Search */}
      {tab === 0 && (
        <Box>
          <TextField
            fullWidth
            placeholder="Search by HSN code or description (e.g. 'Rice', '0901', 'Software')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><BsSearch size={18} color="#999" /></InputAdornment>,
              endAdornment: loading && <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {codes.length === 0 && !loading && (
            <Typography color="text.secondary" textAlign="center" py={4}>No codes found. Try a different search.</Typography>
          )}

          <Stack spacing={1.5}>
            {codes.slice(0, 50).map((code) => (
              <Card key={code.id || code.code} variant="outlined" sx={{ transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(26,60,110,0.1)' } }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Typography fontFamily="monospace" fontWeight={800} fontSize="1rem" color="primary.main">
                          {code.code}
                        </Typography>
                        <RateBadge rate={`${code.rate || 0}%`} />
                        {code.type && (
                          <Chip label={code.type === 'service' ? 'SAC (Service)' : 'HSN (Good)'} size="small"
                            color={code.type === 'service' ? 'secondary' : 'default'} sx={{ fontSize: '0.68rem' }} />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary', lineHeight: 1.6 }}>
                        {code.description}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Tax Rate</Typography>
                      <Typography fontWeight={800} fontSize="1.1rem" color={RATE_COLORS[`${code.rate || 0}%`] || '#666'}>
                        {code.rate || 0}%
                      </Typography>
                      {code.cess && (
                        <Typography variant="caption" color="text.secondary">+ {code.cess}% Cess</Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {codes.length > 50 && (
            <Alert severity="info" sx={{ mt: 2 }}>Showing first 50 results. Refine your search for more specific results.</Alert>
          )}
        </Box>
      )}

      {/* Tab 1: By Tax Rate */}
      {tab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>India has 5 main GST slabs:</strong> 0%, 5%, 12%, 18%, and 28%.
            Essential goods like food grains are at 0%; luxury goods like cars are at 28%.
          </Alert>
          {Object.entries(byRate).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).map(([rate, items]) => {
            const color = RATE_COLORS[rate] || '#666';
            return (
              <Accordion key={rate} expanded={expanded === rate} onChange={(_, v) => setExpanded(v ? rate : false)}
                sx={{ mb: 1.5, border: `1.5px solid ${color}30`, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<BsChevronDown />} sx={{ bgcolor: `${color}08`, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <RateBadge rate={rate} />
                    <Typography fontWeight={700}>{items.length} codes in this slab</Typography>
                    {rate === '0%' && <Chip label="Essentials" size="small" color="success" sx={{ fontSize: '0.68rem' }} />}
                    {rate === '28%' && <Chip label="Luxury/Sin" size="small" color="error" sx={{ fontSize: '0.68rem' }} />}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Grid container spacing={1}>
                    {items.slice(0, 30).map((c) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id || c.code}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                          <Typography fontFamily="monospace" fontWeight={700} fontSize="0.82rem" color={color}>{c.code}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{c.description}</Typography>
                        </Box>
                      </Grid>
                    ))}
                    {items.length > 30 && (
                      <Grid size={12}>
                        <Typography variant="caption" color="text.secondary">+ {items.length - 30} more codes. Use the Search tab to find specific ones.</Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Tab 2: HSN Structure */}
      {tab === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            HSN codes follow a hierarchical structure. More digits = more specific product classification.
            India uses up to 8 digits for import/export and 4-6 digits for GST filing.
          </Alert>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>HSN Code Breakdown Example: Coffee (090111)</Typography>
              <Stack spacing={0}>
                {HSN_STRUCTURE.map((level, idx) => (
                  <Box key={level.level}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ py: 2 }}>
                      <Box sx={{ width: { xs: '100%', sm: 120 }, flexShrink: 0 }}>
                        <Chip label={level.level} size="small" color="primary" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Box sx={{
                        px: 2, py: 1, bgcolor: '#f0f4ff', borderRadius: 1.5,
                        border: '1.5px solid #1a3c6e30', flexShrink: 0
                      }}>
                        <Typography fontFamily="monospace" fontWeight={800} color="primary.main">{level.example}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{level.desc}</Typography>
                    </Stack>
                    {idx < HSN_STRUCTURE.length - 1 && <Divider />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {[
              { title: 'When is HSN mandatory?', items: ['Turnover < ₹1.5 Cr: Optional (4-digit recommended)', 'Turnover ₹1.5–5 Cr: 4-digit HSN mandatory', 'Turnover > ₹5 Cr: 6-digit HSN mandatory', 'Exports/Imports: 8-digit mandatory'] },
              { title: 'HSN vs SAC', items: ['HSN = Harmonised System of Nomenclature', 'Used for physical GOODS', 'SAC = Services Accounting Code', 'Used for SERVICES (e.g., 9983 for IT services)'] },
            ].map(({ title, items }) => (
              <Grid size={{ xs: 12, sm: 6 }} key={title}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <BsInfoCircle size={18} color="#1a3c6e" />
                      <Typography fontWeight={700}>{title}</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {items.map((item, i) => (
                        <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, lineHeight: 1.5 }}>
                          <Box component="span" sx={{ color: '#1a3c6e', fontWeight: 700, flexShrink: 0 }}>›</Box>
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 3: Categories */}
      {tab === 3 && (
        <Box>
          <Grid container spacing={2}>
            {HSN_CATEGORIES.map(({ label, icon, examples, color }) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Card variant="outlined" sx={{
                  height: '100%', transition: 'all 0.2s', cursor: 'pointer',
                  '&:hover': { borderColor: color, transform: 'translateY(-3px)', boxShadow: `0 8px 20px ${color}20` },
                  borderColor: `${color}40`,
                }}
                  onClick={() => { setTab(0); setSearch(examples[0]); }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Typography fontSize="1.8rem">{icon}</Typography>
                      <Typography fontWeight={700} sx={{ color }}>{label}</Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      {examples.map((ex) => (
                        <Typography key={ex} variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box component="span" sx={{ color, fontWeight: 700 }}>›</Box> {ex}
                        </Typography>
                      ))}
                    </Stack>
                    <Button
                      size="small" endIcon={<BsArrowRight size={12} />}
                      sx={{ mt: 2, color, fontSize: '0.75rem', p: 0 }}
                    >
                      Search {label}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

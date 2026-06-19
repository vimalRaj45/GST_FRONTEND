import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, MenuItem, Switch, FormControlLabel,
  Button, Card, CardContent, Grid, Stack, Alert, CircularProgress,
  InputAdornment, Divider
} from '@mui/material';
import {
  BsCalculator, BsCurrencyRupee, BsGlobe, BsGeoAlt,
  BsInfoCircle, BsCheckCircle, BsExclamationTriangle
} from 'react-icons/bs';
import { calculateGST } from '../api/client.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';

const TAX_RATES = [0, 5, 12, 18, 28];
const TRANSACTION_TYPES = [
  { value: 'regular',        label: 'Regular (B2B / B2C)' },
  { value: 'export',         label: 'Export (Zero-rated, ITC claimable)' },
  { value: 'exempt',         label: 'Exempt (No tax, no ITC)' },
  { value: 'reverse_charge', label: 'Reverse Charge (buyer pays)' },
];

function TaxCard({ label, value, color = '#1a3c6e', highlight = false }) {
  return (
    <Box
      sx={{
        textAlign: 'center', p: { xs: 1.5, md: 2 }, borderRadius: 2,
        background: highlight ? 'linear-gradient(135deg,#1a3c6e,#2d5fa0)' : '#fff',
        border: highlight ? 'none' : '1.5px solid #e0e0e0',
        color: highlight ? 'white' : 'inherit',
        transition: 'all 0.3s',
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.72rem', display: 'block', mb: 0.5 }}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color: highlight ? 'white' : color, fontSize: { xs: '1.15rem', md: '1.4rem' } }}>
        ₹{Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default function Calculator() {
  const [form, setForm] = useState({ amount: 10000, rate: 18, isInterstate: false, transactionType: 'regular' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveCalc, setLiveCalc] = useState(null);

  useEffect(() => {
    const amt = Number(form.amount) || 0;
    const r   = Number(form.rate);
    if (amt <= 0 || form.transactionType === 'exempt' || form.transactionType === 'export') {
      setLiveCalc({ cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalValue: amt });
      return;
    }
    const tax = Math.round(amt * r / 100 * 100) / 100;
    if (form.isInterstate) {
      setLiveCalc({ cgst: 0, sgst: 0, igst: tax, totalTax: tax, totalValue: amt + tax });
    } else {
      const half = Math.round(tax / 2 * 100) / 100;
      setLiveCalc({ cgst: half, sgst: half, igst: 0, totalTax: tax, totalValue: amt + tax });
    }
  }, [form]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await calculateGST({ amount: Number(form.amount), rate: Number(form.rate), isInterstate: form.isInterstate, transactionType: form.transactionType });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const display = result || liveCalc || {};

  return (
    <Box>
      <ExplainerCallout title="How GST is Calculated">
        <strong>Intra-state</strong>: CGST (half rate) + SGST (half rate). <strong>Inter-state</strong>: Full IGST only.
        Exports are zero-rated — no tax charged, but ITC is still claimable.
        Exempt goods: no tax and no ITC.
      </ExplainerCallout>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Input Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <BsCalculator size={24} color="#1a3c6e" />
                <Typography variant="h5" fontWeight={700}>GST Calculator</Typography>
              </Stack>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Taxable Amount (₹)" name="amount" type="number"
                    value={form.amount} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BsCurrencyRupee size={16} color="#999" /></InputAdornment> }}
                    required fullWidth
                  />

                  <TextField select label="Tax Rate" name="rate" value={form.rate} onChange={handleChange} fullWidth>
                    {TAX_RATES.map((r) => (
                      <MenuItem key={r} value={r}>{r}%{r === 0 ? ' — Nil / Exempt' : ''}</MenuItem>
                    ))}
                  </TextField>

                  <TextField select label="Transaction Type" name="transactionType" value={form.transactionType} onChange={handleChange} fullWidth>
                    {TRANSACTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </TextField>

                  <Box
                    sx={{ p: 2, border: '1.5px solid', borderColor: form.isInterstate ? 'info.main' : 'divider', borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setForm((f) => ({ ...f, isInterstate: !f.isInterstate }))}
                  >
                    <FormControlLabel
                      control={<Switch name="isInterstate" checked={form.isInterstate} onChange={handleChange} color="info" size="small" />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {form.isInterstate ? <BsGlobe size={16} color="#0288d1" /> : <BsGeoAlt size={16} color="#666" />}
                          <Box>
                            <Typography fontWeight={600} fontSize="0.875rem">
                              {form.isInterstate ? 'Inter-State → IGST' : 'Intra-State → CGST + SGST'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {form.isInterstate ? 'Buyer in a different state' : 'Buyer in the same state'}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>

                  <Button
                    type="submit" variant="contained" size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BsCalculator size={18} />}
                    sx={{ py: 1.2, borderRadius: 2 }}
                    fullWidth
                  >
                    {loading ? 'Calculating...' : 'Calculate via API'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Output Panel */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>Tax Breakdown</Typography>
                <Typography variant="caption" sx={{ px: 1.5, py: 0.5, bgcolor: result ? 'success.light' : 'info.light', borderRadius: 10, color: result ? 'success.dark' : 'info.dark', fontSize: '0.7rem', fontWeight: 600 }}>
                  {result ? '✅ Server verified' : '⚡ Live preview'}
                </Typography>
              </Stack>

              <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 2.5 }}>
                <Grid size={6}><TaxCard label="Taxable Value" value={form.amount} color="#444" /></Grid>
                <Grid size={6}><TaxCard label="IGST (Inter-state)" value={display.igst} color="#0288d1" /></Grid>
                <Grid size={6}><TaxCard label="CGST (Central)" value={display.cgst} color="#1a3c6e" /></Grid>
                <Grid size={6}><TaxCard label="SGST (State)" value={display.sgst} color="#2d5fa0" /></Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                <Grid size={6}><TaxCard label="Total Tax" value={display.totalTax} color="#e07b00" /></Grid>
                <Grid size={6}><TaxCard label="Invoice Total" value={display.totalValue} highlight /></Grid>
              </Grid>

              {/* Contextual alerts */}
              {form.transactionType === 'export' && (
                <Alert severity="info" icon={<BsGlobe />} sx={{ mt: 2, fontSize: '0.82rem' }}>
                  Exports are <strong>zero-rated</strong>. No GST charged but ITC on inputs is still claimable.
                </Alert>
              )}
              {form.transactionType === 'exempt' && (
                <Alert severity="warning" icon={<BsExclamationTriangle />} sx={{ mt: 2, fontSize: '0.82rem' }}>
                  Exempt supply: no GST charged, and <strong>no ITC</strong> can be claimed on related purchases.
                </Alert>
              )}
              {form.transactionType === 'reverse_charge' && (
                <Alert severity="info" icon={<BsInfoCircle />} sx={{ mt: 2, fontSize: '0.82rem' }}>
                  <strong>Reverse Charge (RCM)</strong>: The buyer pays the GST directly to the government.
                </Alert>
              )}
              {form.transactionType === 'regular' && !form.isInterstate && Number(display.totalTax) > 0 && (
                <Alert severity="success" icon={<BsCheckCircle />} sx={{ mt: 2, fontSize: '0.82rem' }}>
                  Intra-state: Tax split equally as CGST ₹{display.cgst?.toFixed(2)} + SGST ₹{display.sgst?.toFixed(2)}.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

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
  { value: 'regular', label: 'Regular (B2B / B2C)' },
  { value: 'export', label: 'Export (Zero-rated, ITC claimable)' },
  { value: 'exempt', label: 'Exempt (No tax, no ITC)' },
  { value: 'reverse_charge', label: 'Reverse Charge (buyer pays)' },
  { value: 'composition', label: 'Composition Scheme (flat rate)' },
];
const COMPOSITION_RATES = [
  { type: 'Trader / Manufacturer', rate: 1 },
  { type: 'Restaurant', rate: 5 },
  { type: 'Other Services', rate: 6 },
];
const SERVICE_POS_RULES = [
  { service: 'IT / Consulting Services', rule: 'POS = Location of the recipient', note: 'If recipient is in different state → IGST applies' },
  { service: 'Banking & Financial', rule: 'POS = Location of the recipient (if known)', note: 'Otherwise: location of the supplier' },
  { service: 'Insurance', rule: 'POS = Location of recipient', note: 'Same as regular services' },
  { service: 'Telecom Services', rule: 'POS = Location where SIM is registered', note: 'Special rule — not based on recipient' },
  { service: 'Construction / Immovable Property', rule: 'POS = Location of the property', note: 'Always where the property is located' },
  { service: 'Restaurant / Catering', rule: 'POS = Where services are performed', note: 'CGST+SGST always, even for tourists' },
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
  const [form, setForm] = useState({ amount: 10000, rate: 18, isInterstate: false, transactionType: 'regular', supplyType: 'goods', compositionType: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveCalc, setLiveCalc] = useState(null);
  const [showPoS, setShowPoS] = useState(false);

  useEffect(() => {
    const amt = Number(form.amount) || 0;
    const r = Number(form.rate);
    if (form.transactionType === 'composition') {
      const compRate = COMPOSITION_RATES[form.compositionType]?.rate || 1;
      const tax = Math.round(amt * compRate / 100 * 100) / 100;
      setLiveCalc({ cgst: 0, sgst: 0, igst: 0, compositionTax: tax, totalTax: tax, totalValue: amt + tax });
      return;
    }
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
        <strong>Intra-state (Goods)</strong>: CGST (half rate) + SGST (half rate). <strong>Inter-state</strong>: Full IGST only.
        For <strong>services</strong>, Place of Supply (POS) is determined by the recipient's location — not the delivery point.
        Exports are zero-rated. Exempt supplies carry no tax and no ITC.
      </ExplainerCallout>

      {/* Supply Type Toggle */}
      <Card sx={{ mb: 3, border: '1.5px solid #1a3c6e25' }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography fontWeight={700} fontSize="0.9rem">Supply Type</Typography>
              <Typography variant="caption" color="text.secondary">Services have different Place of Supply rules than goods</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {['goods', 'services'].map((t) => (
                <Box key={t} onClick={() => setForm((f) => ({ ...f, supplyType: t }))}
                  sx={{
                    px: 2.5, py: 1, borderRadius: 2, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                    border: '2px solid', borderColor: form.supplyType === t ? 'primary.main' : 'divider',
                    bgcolor: form.supplyType === t ? 'primary.main' : 'transparent',
                    color: form.supplyType === t ? 'white' : 'text.secondary',
                    transition: 'all 0.15s', textTransform: 'capitalize',
                  }}>
                  {t === 'goods' ? '📦 Goods' : '🛠️ Services'}
                </Box>
              ))}
            </Stack>
          </Stack>
          {form.supplyType === 'services' && (
            <Alert severity="info" sx={{ mt: 2, fontSize: '0.82rem' }}>
              <strong>Services — Place of Supply Rule:</strong> For services, POS is generally the <strong>location of the recipient</strong>.
              If recipient and supplier are in different states → IGST applies, even if service is delivered locally.
              <Button size="small" sx={{ ml: 1, fontSize: '0.75rem' }} onClick={() => setShowPoS((v) => !v)}>
                {showPoS ? 'Hide' : 'View'} POS Rules
              </Button>
            </Alert>
          )}
          {showPoS && form.supplyType === 'services' && (
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {SERVICE_POS_RULES.map(({ service, rule, note }) => (
                <Box key={service} sx={{ p: 2, borderRadius: 2, border: '1px solid #1a3c6e25', bgcolor: '#f8f9fa' }}>
                  <Typography fontWeight={700} fontSize="0.82rem" color="primary.main">{service}</Typography>
                  <Typography variant="caption" display="block" fontWeight={600} sx={{ mt: 0.5 }}>{rule}</Typography>
                  <Typography variant="caption" color="text.secondary">{note}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

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

                  <TextField select label="Transaction Type" name="transactionType" value={form.transactionType} onChange={handleChange} fullWidth>
                    {TRANSACTION_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </TextField>

                  {form.transactionType === 'composition' ? (
                    <Box sx={{ p: 2, bgcolor: '#fff8e1', border: '2px solid #f57f1730', borderRadius: 2 }}>
                      <Typography fontWeight={700} fontSize="0.875rem" color="#f57f17" sx={{ mb: 1 }}>
                        🏪 Composition Scheme
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                        Composition dealers pay a flat low rate on total turnover. No CGST/SGST/IGST split — one single flat payment.
                        They <strong>cannot issue Tax Invoices</strong> and <strong>cannot claim ITC</strong>.
                      </Typography>
                      <TextField select label="Business Type" size="small" fullWidth
                        value={form.compositionType}
                        onChange={(e) => setForm((f) => ({ ...f, compositionType: Number(e.target.value) }))}
                      >
                        {COMPOSITION_RATES.map((r, i) => (
                          <MenuItem key={r.type} value={i}>{r.type} — {r.rate}% flat</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ) : (
                    <TextField select label="Tax Rate" name="rate" value={form.rate} onChange={handleChange} fullWidth>
                      {TAX_RATES.map((r) => (
                        <MenuItem key={r} value={r}>{r}%{r === 0 ? ' — Nil / Exempt' : ''}</MenuItem>
                      ))}
                    </TextField>
                  )}

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
              {form.transactionType === 'composition' && (
                <Alert severity="warning" icon={<BsExclamationTriangle />} sx={{ mt: 2, fontSize: '0.82rem' }}>
                  <strong>Composition Scheme:</strong> Flat rate of {COMPOSITION_RATES[form.compositionType]?.rate}% applied on turnover.
                  Composition dealers <strong>cannot issue Tax Invoices</strong>, <strong>cannot collect GST from buyers</strong>,
                  and <strong>cannot claim ITC</strong> on purchases.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

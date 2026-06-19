import React, { useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Button, Card, CardContent,
  Alert, Divider, Stack, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  BsBuilding, BsCheckCircle, BsReceiptCutoff, BsHouseDoor,
  BsGeoAlt, BsCardList
} from 'react-icons/bs';
import { createBusiness } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import useProgressStore from '../store/useProgressStore.js';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

export default function RegisterBusiness() {
  const [form, setForm] = useState({ name: '', state: 'Maharashtra', scheme_type: 'regular' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const setBusiness = useAppStore((s) => s.setBusiness);
  const sessionId = useAppStore((s) => s.sessionId);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { markModule } = useProgressStore();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createBusiness({ ...form, session_id: sessionId });
      setResult(res);
      setBusiness(res.business);
      markModule('registeredBusiness');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Box maxWidth={580} mx="auto" px={{ xs: 0, sm: 1 }}>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
            <BsCheckCircle size={56} color="#2e7d32" style={{ marginBottom: 12 }} />
            <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom>
              Business Setup
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
              Register a simulated GST business to start generating invoices and filing returns.
              {isAuthenticated ? ' This business will be saved to your account.' : ''}
            </Typography>

            <Box
              sx={{
                background: 'linear-gradient(135deg,#1a3c6e,#2d5fa0)',
                color: 'white', borderRadius: 3, p: { xs: 2.5, md: 3 }, mb: 3,
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.75, fontSize: '0.65rem', letterSpacing: 2 }}>
                YOUR GSTIN
              </Typography>
              <Typography
                fontWeight={800} letterSpacing={3}
                sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.9rem' }, fontFamily: 'monospace', mt: 0.5 }}
              >
                {result.business.gstin}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                Simulated GST Identification Number
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ mb: 3, textAlign: 'left' }}>
              {[
                { label: 'Business Name', value: result.business.name },
                { label: 'State', value: result.business.state },
                { label: 'Scheme', value: result.business.scheme_type, chip: true },
                ...(result.period ? [{ label: 'Current Period', value: `${result.period.month}/${result.period.year}` }] : []),
              ].map(({ label, value, chip }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography color="text.secondary" fontSize="0.875rem">{label}</Typography>
                  {chip ? <Chip label={value} color="primary" size="small" /> : <Typography fontWeight={600} fontSize="0.875rem">{value}</Typography>}
                </Box>
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" fullWidth startIcon={<BsReceiptCutoff size={16} />} onClick={() => navigate('/invoices/new')}>
                Create First Invoice
              </Button>
              <Button variant="outlined" fullWidth startIcon={<BsHouseDoor size={16} />} onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxWidth={580} mx="auto" px={{ xs: 0, sm: 1 }}>
      <ExplainerCallout title="What is GSTIN Registration?">
        In India, every business above ₹40 lakh turnover (₹20 lakh for services) must register for GST
        and get a 15-digit GSTIN. Here we simulate that: you get a mock GSTIN based on your state code
        and business name — no real government APIs involved.
      </ExplainerCallout>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <BsBuilding size={28} color="#1a3c6e" />
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' } }}>
              Register a Business
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Business Name" name="name" value={form.name} onChange={handleChange}
                required fullWidth placeholder="e.g. Sharma Electronics Pvt Ltd"
                InputProps={{ startAdornment: <BsBuilding size={16} color="#999" style={{ marginRight: 8 }} /> }}
              />

              <TextField
                select label="State of Registration" name="state" value={form.state}
                onChange={handleChange} required fullWidth
                InputProps={{ startAdornment: <BsGeoAlt size={16} color="#999" style={{ marginRight: 8 }} /> }}
              >
                {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>

              <FormControl>
                <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BsCardList size={16} /> GST Scheme Type
                </FormLabel>
                <RadioGroup name="scheme_type" value={form.scheme_type} onChange={handleChange}>
                  <Stack spacing={1}>
                    {[
                      { value: 'regular', label: 'Regular Scheme', sub: 'Full GST rates; can claim ITC on purchases' },
                      { value: 'composition', label: 'Composition Scheme', sub: 'Flat low rate (1-6%); cannot claim ITC' },
                    ].map(({ value, label, sub }) => (
                      <Box
                        key={value}
                        onClick={() => setForm((f) => ({ ...f, scheme_type: value }))}
                        sx={{
                          p: 1.5, border: '2px solid', borderRadius: 2, cursor: 'pointer',
                          borderColor: form.scheme_type === value ? 'primary.main' : 'divider',
                          bgcolor: form.scheme_type === value ? 'primary.light' + '18' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <FormControlLabel value={value} control={<Radio size="small" />} label="" sx={{ m: 0, display: 'none' }} />
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Radio value={value} size="small" checked={form.scheme_type === value} sx={{ p: 0 }} />
                          <Box>
                            <Typography fontWeight={600} fontSize="0.9rem">{label}</Typography>
                            <Typography variant="caption" color="text.secondary">{sub}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </RadioGroup>
              </FormControl>

              <Divider />

              <Alert severity="info" variant="outlined" sx={{ fontSize: '0.8rem' }}>
                <strong>GSTIN Format:</strong> [2-digit state] + [10-char PAN-like] + entity + Z + check
              </Alert>

              <Button
                type="submit" variant="contained" size="large"
                disabled={loading || !form.name || !form.state}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BsBuilding size={18} />}
                sx={{ py: 1.3, borderRadius: 2 }}
              >
                {loading ? 'Registering...' : 'Register & Get GSTIN'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

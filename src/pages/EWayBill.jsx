import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Alert,
  Button, Stepper, Step, StepLabel, StepContent, Divider, TextField,
  InputAdornment, CircularProgress
} from '@mui/material';
import { BsTruck, BsArrowLeft, BsArrowRight, BsInfoCircle, BsCheckCircle, BsShieldCheck, BsGeoAlt } from 'react-icons/bs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getInvoice } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import useProgressStore from '../store/useProgressStore.js';

const VALIDITY_RULES = [
  { distance: 'Up to 100 km', validity: '1 day' },
  { distance: '100–300 km', validity: '3 days' },
  { distance: '300–500 km', validity: '5 days' },
  { distance: '500–1000 km', validity: '10 days' },
  { distance: 'More than 1000 km', validity: '15 days' },
];

const EXEMPTIONS = [
  'Transport of goods below ₹50,000 value',
  'Goods exempt from GST (fresh vegetables, milk, etc.)',
  'Transport by non-motorized vehicle (cycle, cart)',
  'Transport by railways or inland waterways',
  'Transport within 10 km (intra-city) from business premises to weighbridge',
  'Goods transported under customs bond',
];

function generateEWBNumber() {
  const prefix = '131';
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefix}${random}`;
}

export default function EWayBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const { business } = useAppStore();
  const { markModule } = useProgressStore();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [form, setForm] = useState({
    transporterName: '',
    vehicleNumber: '',
    distance: '',
    transportMode: 'Road',
  });

  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      getInvoice(invoiceId).then(setInvoice).catch(() => {}).finally(() => setLoading(false));
    }
  }, [invoiceId]);

  const invoiceTotal = invoice?.items?.reduce((s, it) => s + Number(it.total_value || 0), 0) || 0;
  const isRequired = invoiceTotal >= 50000;

  const handleGenerate = () => {
    const ewb = {
      ewbNumber: generateEWBNumber(),
      generatedAt: new Date().toISOString(),
      validUntil: (() => {
        const d = parseInt(form.distance) || 100;
        let days = 1;
        if (d > 1000) days = 15;
        else if (d > 500) days = 10;
        else if (d > 300) days = 5;
        else if (d > 100) days = 3;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return { date: date.toLocaleDateString('en-IN'), days };
      })(),
      transporter: form.transporterName,
      vehicle: form.vehicleNumber,
      distance: form.distance,
      mode: form.transportMode,
      invoiceNumber: invoice?.invoice_number || 'N/A',
      invoiceValue: invoiceTotal,
      fromGstin: invoice?.seller_gstin || business?.gstin || 'N/A',
      toGstin: invoice?.buyer_gstin || 'N/A',
    };
    setGenerated(ewb);
    setStep(2);
    markModule('generatedEWayBill');
  };

  return (
    <Box maxWidth={900} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<BsArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</Button>
        <Chip label="Educational Simulation" color="warning" size="small" />
      </Stack>

      <ExplainerCallout title="What is an E-Way Bill?">
        An <strong>E-Way Bill</strong> (Electronic Way Bill) is a compliance document required for movement of goods worth more than
        <strong> ₹50,000</strong> within India. It's generated on the GST portal before transport begins.
        The transporter must carry it during transit and show it to authorities if required.
      </ExplainerCallout>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BsTruck size={26} color="#00796b" />
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.8rem' } }}>
            E-Way Bill Simulator
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Learn how goods movement is documented under GST
          </Typography>
        </Box>
      </Stack>

      {/* When is it required? */}
      {!invoiceId && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ border: '2px solid #00796b30', bgcolor: '#e0f2f1', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <BsCheckCircle size={20} color="#00796b" />
                  <Typography fontWeight={700} color="#00796b">E-Way Bill IS Required</Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {['Goods value exceeds ₹50,000', 'Inter-state movement of any value', 'Transport by road, rail, air or ship', 'B2B supply, B2C supply or stock transfer'].map((i) => (
                    <Typography key={i} variant="body2" sx={{ display: 'flex', gap: 1 }}>
                      <Box component="span" color="#00796b">✓</Box> {i}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ border: '2px solid #c6282830', bgcolor: '#ffebee', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <BsShieldCheck size={20} color="#c62828" />
                  <Typography fontWeight={700} color="#c62828">Exemptions (Not Required)</Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {EXEMPTIONS.slice(0, 4).map((ex) => (
                    <Typography key={ex} variant="body2" sx={{ display: 'flex', gap: 1 }}>
                      <Box component="span" color="#c62828">✗</Box> {ex}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Validity Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BsGeoAlt size={18} color="#1a3c6e" /> E-Way Bill Validity by Distance
          </Typography>
          <Grid container spacing={1}>
            {VALIDITY_RULES.map(({ distance, validity }) => (
              <Grid size={{ xs: 6, sm: 4, md: 'auto' }} key={distance} sx={{ flex: { md: 1 } }}>
                <Box sx={{ p: 1.5, borderRadius: 2, border: '1.5px solid #1a3c6e20', textAlign: 'center', bgcolor: '#f8f9fa' }}>
                  <Typography variant="caption" color="text.secondary" display="block" fontSize="0.7rem">{distance}</Typography>
                  <Typography fontWeight={800} color="#1a3c6e" fontSize="1rem">{validity}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Simulation */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Generate Simulated E-Way Bill</Typography>

          {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />}

          {invoice && (
            <Alert severity={isRequired ? 'warning' : 'success'} sx={{ mb: 3 }}>
              {isRequired
                ? <><strong>E-Way Bill Required:</strong> Invoice {invoice.invoice_number} is ₹{invoiceTotal.toFixed(0)}, which exceeds the ₹50,000 threshold.</>
                : <><strong>E-Way Bill Optional:</strong> Invoice {invoice.invoice_number} is ₹{invoiceTotal.toFixed(0)}, below the ₹50,000 threshold.</>
              }
            </Alert>
          )}

          <Stepper activeStep={step} orientation="vertical">
            {/* Step 0: Part A — Goods Details */}
            <Step active={step === 0} completed={step > 0}>
              <StepLabel>
                <Typography fontWeight={700}>Part A — Supply Details</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Part A contains information about the goods being transported — who is supplying, who is receiving.
                </Typography>
                {invoice ? (
                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {[
                      { label: 'Invoice Number', value: invoice.invoice_number },
                      { label: 'Invoice Value', value: `₹${invoiceTotal.toFixed(0)}` },
                      { label: 'Supplier GSTIN', value: invoice.seller_gstin || business?.gstin || 'N/A' },
                      { label: 'Recipient GSTIN', value: invoice.buyer_gstin || 'B2C (Unregistered)' },
                      { label: 'Place of Delivery', value: invoice.buyer_state || 'N/A' },
                    ].map(({ label, value }) => (
                      <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>No invoice selected. Simulating with sample data.</Alert>
                )}
                <Button variant="contained" endIcon={<BsArrowRight />} onClick={() => setStep(1)}>
                  Next: Transport Details
                </Button>
              </StepContent>
            </Step>

            {/* Step 1: Part B — Transporter Details */}
            <Step active={step === 1} completed={step > 1}>
              <StepLabel>
                <Typography fontWeight={700}>Part B — Transporter Details</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Part B must be filled by the transporter before goods are moved. It includes vehicle and distance details.
                </Typography>
                <Stack spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    label="Transporter Name" size="small" fullWidth
                    value={form.transporterName}
                    onChange={(e) => setForm((f) => ({ ...f, transporterName: e.target.value }))}
                    placeholder="e.g. Sharma Logistics Pvt Ltd"
                  />
                  <TextField
                    label="Vehicle Number" size="small" fullWidth
                    value={form.vehicleNumber}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
                    placeholder="e.g. MH12AB1234"
                  />
                  <TextField
                    label="Approximate Distance (km)" size="small" fullWidth type="number"
                    value={form.distance}
                    onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
                    InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                  />
                  <TextField
                    select label="Mode of Transport" size="small" fullWidth
                    value={form.transportMode}
                    onChange={(e) => setForm((f) => ({ ...f, transportMode: e.target.value }))}
                    SelectProps={{ native: true }}
                  >
                    {['Road', 'Rail', 'Air', 'Ship'].map((m) => <option key={m} value={m}>{m}</option>)}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <Button startIcon={<BsArrowLeft />} onClick={() => setStep(0)}>Back</Button>
                  <Button variant="contained" color="success" endIcon={<BsArrowRight />}
                    onClick={handleGenerate}
                    disabled={!form.transporterName || !form.vehicleNumber || !form.distance}
                  >
                    Generate E-Way Bill
                  </Button>
                </Stack>
              </StepContent>
            </Step>

            {/* Step 2: Generated EWB */}
            <Step active={step === 2} completed={false}>
              <StepLabel>
                <Typography fontWeight={700}>E-Way Bill Generated ✓</Typography>
              </StepLabel>
              <StepContent>
                {generated && (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      E-Way Bill successfully generated! (Simulated — not a real EWB)
                    </Alert>
                    <Card sx={{ border: '2px solid #00796b40', bgcolor: '#e0f2f1' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="overline" color="text.secondary" fontSize="0.65rem">E-WAY BILL NUMBER</Typography>
                            <Typography fontFamily="monospace" fontWeight={900} fontSize="1.3rem" color="#00796b" letterSpacing={1}>
                              {generated.ewbNumber}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary" display="block">Valid Until</Typography>
                            <Typography fontWeight={700} color="#c62828">{generated.validUntil.date}</Typography>
                            <Typography variant="caption" color="text.secondary">({generated.validUntil.days} day{generated.validUntil.days > 1 ? 's' : ''})</Typography>
                          </Box>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={1.5}>
                          {[
                            { label: 'Invoice', value: generated.invoiceNumber },
                            { label: 'Invoice Value', value: `₹${generated.invoiceValue.toFixed(0)}` },
                            { label: 'Transporter', value: generated.transporter },
                            { label: 'Vehicle', value: generated.vehicle },
                            { label: 'Distance', value: `${generated.distance} km` },
                            { label: 'Mode', value: generated.mode },
                          ].map(({ label, value }) => (
                            <Grid size={{ xs: 6, sm: 4 }} key={label}>
                              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                              <Typography fontWeight={600} fontSize="0.875rem">{value}</Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.82rem' }}>
                      <strong>Remember:</strong> The transporter must carry this EWB document physically or digitally.
                      If goods are not delivered within the validity period, the EWB must be extended.
                    </Alert>
                  </Box>
                )}
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
}

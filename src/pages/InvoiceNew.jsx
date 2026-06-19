import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stepper, Step, StepLabel, Button, TextField, MenuItem,
  Card, CardContent, Stack, Grid, IconButton, Alert, CircularProgress,
  Autocomplete, Divider, Chip, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import {
  BsPlusCircle, BsTrash, BsReceiptCutoff, BsArrowLeft, BsArrowRight,
  BsCheckCircle, BsGlobe, BsGeoAlt, BsSearch
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { createInvoice, getHsnCodes, listBusinesses, getPeriods } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import StatusChip from '../components/StatusChip.jsx';

const TAX_RATES = [0, 5, 12, 18, 28];
const INVOICE_TYPES = [
  { value: 'tax_invoice',     label: 'Tax Invoice' },
  { value: 'bill_of_supply',  label: 'Bill of Supply (Composition/Exempt)' },
  { value: 'credit_note',     label: 'Credit Note' },
  { value: 'debit_note',      label: 'Debit Note' },
];
const TX_TYPES = [
  { value: 'regular',        label: 'Regular' },
  { value: 'export',         label: 'Export (Zero-rated)' },
  { value: 'exempt',         label: 'Exempt' },
  { value: 'reverse_charge', label: 'Reverse Charge' },
];

const defaultItem = () => ({
  item_name: '', hsn_code_id: null, hsn_code: '', qty: 1,
  unit_price: 0, tax_rate: 18, transaction_type: 'regular', _key: crypto.randomUUID(),
});

function calcItemTax(item, isInterstate) {
  const taxable = Math.round(item.qty * item.unit_price * 100) / 100;
  const r = item.tax_rate;
  if (item.transaction_type === 'exempt' || item.transaction_type === 'export' || r === 0)
    return { taxable, cgst: 0, sgst: 0, igst: 0, total: taxable };
  const tax = Math.round(taxable * r / 100 * 100) / 100;
  if (isInterstate) return { taxable, cgst: 0, sgst: 0, igst: tax, total: taxable + tax };
  const half = Math.round(tax / 2 * 100) / 100;
  return { taxable, cgst: half, sgst: half, igst: 0, total: taxable + tax };
}

export default function InvoiceNew() {
  const navigate = useNavigate();
  const { business, sessionId, isTourActive, tourStep, nextTourStep } = useAppStore();
  const [step, setStep] = useState(0);
  const [header, setHeader] = useState({ buyer_business_id: '', invoice_type: 'tax_invoice', transaction_type: 'regular', tax_period_id: '', notes: '' });
  const [items, setItems] = useState([defaultItem()]);
  const [buyers, setBuyers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [hsnOptions, setHsnOptions] = useState([]);
  const [hsnLoading, setHsnLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  useEffect(() => {
    if (sessionId) listBusinesses(sessionId).then(setBuyers).catch(() => {});
    if (business?.id) {
      getPeriods(business.id).then((p) => {
        setPeriods(p);
        const open = p.find((x) => x.status === 'open');
        if (open) setHeader((h) => ({ ...h, tax_period_id: open.id }));
      }).catch(() => {});
    }
  }, [business?.id, sessionId]);

  // Auto-Pilot Logic
  useEffect(() => {
    if (isTourActive && tourStep === 2) {
      if (step === 0 && header.tax_period_id) {
        const timer = setTimeout(() => setStep(1), 2000);
        return () => clearTimeout(timer);
      } else if (step === 1) {
        const timer1 = setTimeout(() => {
           setItems(prev => [{ ...prev[0], item_name: 'High-end Laptop', unit_price: 55000, tax_rate: 18 }]);
        }, 1000);
        const timer2 = setTimeout(() => setStep(2), 3000);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
      } else if (step === 2 && !submitting && !createdInvoice) {
        const timer = setTimeout(() => {
          document.getElementById('auto-submit-btn')?.click();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isTourActive, tourStep, step, header.tax_period_id, submitting, createdInvoice]);

  // Handle tour progression on success
  useEffect(() => {
    if (isTourActive && tourStep === 2 && createdInvoice) {
      const timer = setTimeout(() => nextTourStep(), 2500);
      return () => clearTimeout(timer);
    }
  }, [createdInvoice, isTourActive, tourStep, nextTourStep]);

  const selectedBuyer = buyers.find((b) => b.id === header.buyer_business_id);
  const isInterstate = business && selectedBuyer ? business.state_code !== selectedBuyer.state_code : false;

  const totals = items.reduce((acc, item) => {
    const t = calcItemTax(item, isInterstate);
    return { taxable: acc.taxable + t.taxable, cgst: acc.cgst + t.cgst, sgst: acc.sgst + t.sgst, igst: acc.igst + t.igst, total: acc.total + t.total };
  }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  const searchHSN = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setHsnLoading(true);
    try { const res = await getHsnCodes(q); setHsnOptions(res); } catch (_) {} finally { setHsnLoading(false); }
  }, []);

  const updateItem = (key, field, value) =>
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, [field]: value } : it));
  const addItem    = () => setItems((prev) => [...prev, defaultItem()]);
  const removeItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

  const handleSubmit = async () => {
    if (!business) { setError('Please register a business first'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await createInvoice({
        seller_business_id: business.id,
        buyer_business_id: header.buyer_business_id || null,
        tax_period_id: header.tax_period_id,
        invoice_type: header.invoice_type,
        transaction_type: header.transaction_type,
        notes: header.notes || null,
        items: items.map((it) => ({ item_name: it.item_name, hsn_code_id: it.hsn_code_id || null, hsn_code: it.hsn_code || null, qty: Number(it.qty), unit_price: Number(it.unit_price), tax_rate: Number(it.tax_rate), transaction_type: it.transaction_type })),
      });
      setCreatedInvoice(res);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!business) return (
    <Alert severity="warning" action={<Button onClick={() => navigate('/register')}>Register Now</Button>}>
      Please register a business before creating invoices.
    </Alert>
  );

  return (
    <Box>
      <ExplainerCallout title="Creating a Tax Invoice">
        A Tax Invoice is the core GST document — it records the sale, calculates tax, and creates an ITC entry for the
        buyer. Intra-state = CGST + SGST. Inter-state = IGST. All items and ITC entries are saved atomically.
      </ExplainerCallout>

      {/* Stepper — scrollable on mobile */}
      <Box sx={{ overflowX: 'auto', mb: 3 }}>
        <Stepper activeStep={step} sx={{ minWidth: 420 }}>
          {['Invoice Header', 'Line Items', 'Review', 'Done'].map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Step 0: Header ── */}
      {step === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Invoice Header</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField label="Seller (You)" value={business.name} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Buyer Business" value={header.buyer_business_id}
                  onChange={(e) => setHeader((h) => ({ ...h, buyer_business_id: e.target.value }))} fullWidth>
                  <MenuItem value="">— B2C / No specific buyer —</MenuItem>
                  {buyers.filter((b) => b.id !== business.id).map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name} ({b.state})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Invoice Type" value={header.invoice_type}
                  onChange={(e) => setHeader((h) => ({ ...h, invoice_type: e.target.value }))} fullWidth>
                  {INVOICE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Transaction Type" value={header.transaction_type}
                  onChange={(e) => setHeader((h) => ({ ...h, transaction_type: e.target.value }))} fullWidth>
                  {TX_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Tax Period" value={header.tax_period_id}
                  onChange={(e) => setHeader((h) => ({ ...h, tax_period_id: e.target.value }))} required fullWidth>
                  {periods.filter((p) => p.status === 'open').map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.month}/{p.year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {isInterstate && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<BsGlobe />}>
                    <strong>Inter-State</strong> — IGST applies (seller: {business.state}, buyer: {selectedBuyer?.state})
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField label="Notes (optional)" value={header.notes} multiline rows={2}
                  onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))} fullWidth />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" endIcon={<BsArrowRight />} onClick={() => setStep(1)} disabled={!header.tax_period_id}>
                Line Items
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Items ── */}
      {step === 1 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700}>Line Items</Typography>
              <Button startIcon={<BsPlusCircle size={16} />} onClick={addItem} variant="outlined" size="small">Add Item</Button>
            </Stack>
            <Stack spacing={2.5}>
              {items.map((item, idx) => {
                const t = calcItemTax(item, isInterstate);
                return (
                  <Card key={item._key} variant="outlined">
                    <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography fontWeight={700} fontSize="0.9rem">Item #{idx + 1}</Typography>
                        {items.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeItem(item._key)}>
                            <BsTrash size={15} />
                          </IconButton>
                        )}
                      </Stack>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Item Name" value={item.item_name} fullWidth size="small" required
                            onChange={(e) => updateItem(item._key, 'item_name', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            options={hsnOptions} getOptionLabel={(o) => `${o.code} — ${o.description}`}
                            loading={hsnLoading}
                            onInputChange={(_, v) => searchHSN(v)}
                            onChange={(_, v) => { if (v) { updateItem(item._key, 'hsn_code_id', v.id); updateItem(item._key, 'hsn_code', v.code); updateItem(item._key, 'tax_rate', v.tax_rate || 18); } }}
                            renderInput={(params) => (
                              <TextField {...params} label="HSN Code (search)" size="small"
                                InputProps={{ ...params.InputProps, startAdornment: <BsSearch size={14} color="#999" style={{ marginRight: 6 }} /> }} />
                            )}
                          />
                        </Grid>
                        <Grid item xs={4} sm={3}>
                          <TextField label="Qty" type="number" size="small" value={item.qty} fullWidth
                            onChange={(e) => updateItem(item._key, 'qty', e.target.value)} />
                        </Grid>
                        <Grid item xs={4} sm={5}>
                          <TextField label="Unit Price (₹)" type="number" size="small" value={item.unit_price} fullWidth
                            onChange={(e) => updateItem(item._key, 'unit_price', e.target.value)} />
                        </Grid>
                        <Grid item xs={4} sm={4}>
                          <TextField select label="Rate" value={item.tax_rate} size="small" fullWidth
                            onChange={(e) => updateItem(item._key, 'tax_rate', Number(e.target.value))}>
                            {TAX_RATES.map((r) => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                          </TextField>
                        </Grid>
                      </Grid>
                      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                        <Chip label={`Taxable: ₹${t.taxable.toFixed(0)}`} size="small" variant="outlined" />
                        {t.cgst > 0 && <Chip label={`CGST: ₹${t.cgst.toFixed(0)}`} color="primary" size="small" variant="outlined" />}
                        {t.sgst > 0 && <Chip label={`SGST: ₹${t.sgst.toFixed(0)}`} color="secondary" size="small" variant="outlined" />}
                        {t.igst > 0 && <Chip label={`IGST: ₹${t.igst.toFixed(0)}`} color="info" size="small" variant="outlined" />}
                        <Chip label={`Total: ₹${t.total.toFixed(0)}`} color="success" size="small" />
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button startIcon={<BsArrowLeft />} onClick={() => setStep(0)}>Back</Button>
              <Button variant="contained" endIcon={<BsArrowRight />} onClick={() => setStep(2)}
                disabled={items.some((it) => !it.item_name || it.unit_price <= 0)}>
                Review
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Review Invoice</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}><Typography color="text.secondary" fontSize="0.8rem">Seller</Typography><Typography fontWeight={600}>{business.name}</Typography></Grid>
              <Grid item xs={6}><Typography color="text.secondary" fontSize="0.8rem">Buyer</Typography><Typography fontWeight={600}>{selectedBuyer?.name || 'B2C'}</Typography></Grid>
              <Grid item xs={6}><Typography color="text.secondary" fontSize="0.8rem">Type</Typography><StatusChip status={header.invoice_type} /></Grid>
              <Grid item xs={6}>
                <Typography color="text.secondary" fontSize="0.8rem">Tax Mode</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {isInterstate ? <BsGlobe size={14} color="#0288d1" /> : <BsGeoAlt size={14} color="#1a3c6e" />}
                  <Typography fontWeight={600} fontSize="0.875rem">{isInterstate ? 'IGST' : 'CGST+SGST'}</Typography>
                </Stack>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
            {/* Mobile-friendly table — scrollable */}
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Taxable</TableCell>
                    <TableCell align="right">CGST</TableCell>
                    <TableCell align="right">SGST</TableCell>
                    <TableCell align="right">IGST</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const t = calcItemTax(item, isInterstate);
                    return (
                      <TableRow key={item._key}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell align="right">₹{t.taxable.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{t.cgst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{t.sgst.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{t.igst.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{t.total.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', pt: 1 } }}>
                    <TableCell>Grand Total</TableCell>
                    <TableCell align="right">₹{totals.taxable.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totals.cgst.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totals.sgst.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{totals.igst.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontSize: '1rem' }}>₹{totals.total.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button startIcon={<BsArrowLeft />} onClick={() => setStep(1)}>Back</Button>
              <Button variant="contained" color="success" onClick={handleSubmit}
                id="auto-submit-btn"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <BsCheckCircle size={16} />}>
                {submitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && createdInvoice && (
        <Card sx={{ textAlign: 'center' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <BsCheckCircle size={64} color="#2e7d32" style={{ marginBottom: 16 }} />
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>Invoice Created!</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>{createdInvoice.invoice?.invoice_number}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="contained" startIcon={<BsReceiptCutoff size={16} />} onClick={() => navigate(`/invoices/${createdInvoice.invoice?.id}`)}>View Invoice</Button>
              <Button variant="outlined" startIcon={<BsArrowLeft size={16} />} onClick={() => { setStep(0); setItems([defaultItem()]); setCreatedInvoice(null); }}>Create Another</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

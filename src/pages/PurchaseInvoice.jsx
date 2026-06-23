import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stepper, Step, StepLabel, Button, TextField, MenuItem,
  Card, CardContent, Stack, Grid, IconButton, Alert, CircularProgress,
  Autocomplete, Divider, Chip, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import {
  BsPlusCircle, BsTrash, BsReceiptCutoff, BsArrowLeft, BsArrowRight,
  BsCheckCircle, BsGlobe, BsGeoAlt, BsSearch, BsBoxArrowInDown, BsBoxArrowUp
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { createInvoice, getHsnCodes, listBusinesses, getPeriods } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import StatusChip from '../components/StatusChip.jsx';
import useProgressStore from '../store/useProgressStore.js';

const TAX_RATES = [0, 5, 18, 40];
const TX_TYPES = [
  { value: 'regular',        label: 'Regular' },
  { value: 'exempt',         label: 'Exempt (No ITC)' },
  { value: 'reverse_charge', label: 'Reverse Charge (You pay GST)' },
];

const defaultItem = () => ({
  item_name: '', hsn_code_id: null, hsn_code: '', qty: 1,
  unit_price: 0, tax_rate: 18, transaction_type: 'regular',
  _key: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9),
});

function calcItemTax(item, isInterstate) {
  const taxable = Math.round(item.qty * item.unit_price * 100) / 100;
  const r = item.tax_rate;
  if (item.transaction_type === 'exempt' || r === 0)
    return { taxable, cgst: 0, sgst: 0, igst: 0, total: taxable, itcEligible: false };
  const tax = Math.round(taxable * r / 100 * 100) / 100;
  if (isInterstate) return { taxable, cgst: 0, sgst: 0, igst: tax, total: taxable + tax, itcEligible: true };
  const half = Math.round(tax / 2 * 100) / 100;
  return { taxable, cgst: half, sgst: half, igst: 0, total: taxable + tax, itcEligible: true };
}

export default function PurchaseInvoice() {
  const navigate = useNavigate();
  const { business, sessionId } = useAppStore();
  const { markModule } = useProgressStore();

  const [step, setStep] = useState(0);
  const [header, setHeader] = useState({
    seller_business_id: '',
    transaction_type: 'regular',
    tax_period_id: '',
    notes: '',
  });
  const [items, setItems] = useState([defaultItem()]);
  const [sellers, setSellers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [hsnOptions, setHsnOptions] = useState([]);
  const [hsnLoading, setHsnLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  useEffect(() => {
    if (sessionId) listBusinesses(sessionId).then(setSellers).catch(() => {});
    if (business?.id) {
      getPeriods(business.id).then((p) => {
        setPeriods(p);
        const open = p.find((x) => x.status === 'open');
        if (open) setHeader((h) => ({ ...h, tax_period_id: open.id }));
      }).catch(() => {});
    }
  }, [business?.id, sessionId]);

  const selectedSeller = sellers.find((b) => b.id === header.seller_business_id);
  const isInterstate = business && selectedSeller ? business.state_code !== selectedSeller.state_code : false;

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
    if (!business) { setError('Please select a simulated business scenario first'); return; }
    setSubmitting(true); setError(null);
    try {
      // Purchase = you are the BUYER; the seller_business_id from our list is the seller
      const res = await createInvoice({
        seller_business_id: header.seller_business_id || null,
        buyer_business_id: business.id,
        tax_period_id: header.tax_period_id,
        invoice_type: 'tax_invoice',
        transaction_type: header.transaction_type,
        notes: header.notes || null,
        items: items.map((it) => ({
          item_name: it.item_name, hsn_code_id: it.hsn_code_id || null,
          hsn_code: it.hsn_code || null, qty: Number(it.qty),
          unit_price: Number(it.unit_price), tax_rate: Number(it.tax_rate),
          transaction_type: it.transaction_type,
        })),
      });
      setCreatedInvoice(res);
      setStep(3);
      markModule('createdInvoice');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!business) return (
    <Alert severity="warning" action={<Button onClick={() => navigate('/register-business')}>Choose Business</Button>}>
      Please select a simulated business scenario before recording purchases.
    </Alert>
  );

  return (
    <Box>
      {/* ── Invoice Creation Toggle ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Box sx={{
          display: 'inline-flex', borderRadius: 3, p: 0.5,
          bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
          flexWrap: 'wrap', gap: { xs: 0.5, sm: 0 }
        }}>
          <Box
            onClick={() => navigate('/invoices/sell')}
            sx={{
              px: 3, py: 1, borderRadius: 2.5, fontWeight: 600, fontSize: '0.9rem',
              color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: '#e2e8f0', color: '#065f46' },
            }}>
            <BsBoxArrowUp size={16} /> Sell Invoice
          </Box>
          <Box sx={{
            px: 3, py: 1, borderRadius: 2.5, fontWeight: 700, fontSize: '0.9rem',
            bgcolor: '#1d4ed8', color: 'white', cursor: 'default',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <BsBoxArrowInDown size={16} /> Purchase Invoice
          </Box>
          <Box
            onClick={() => navigate('/invoices/new')}
            sx={{
              px: 3, py: 1, borderRadius: 2.5, fontWeight: 600, fontSize: '0.9rem',
              color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: '#e2e8f0', color: '#1a3c6e' },
            }}>
            <BsReceiptCutoff size={16} /> Quotations
          </Box>
        </Box>
      </Box>

      {/* Header Banner */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
        color: 'white', borderRadius: 2, p: { xs: 2.5, md: 3 }, mb: 3,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <BsBoxArrowInDown size={28} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Purchase — Inward Supply Invoice</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            You are the <strong>Buyer</strong>. Record goods/services purchased and claim Input Tax Credit (ITC).
          </Typography>
        </Box>
      </Box>

      <ExplainerCallout title="Inward Supply (Purchase) & ITC">
        When you purchase from a registered supplier, the GST you pay can be claimed as Input Tax Credit (ITC).
        ITC reduces your net GST payable on sales. Exempt purchases do not qualify for ITC.
      </ExplainerCallout>

      {/* Stepper */}
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={step} alternativeLabel>
          {['Purchase Details', 'Items Bought', 'Review', 'Done'].map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' }, fontSize: '0.8rem', fontWeight: 600 } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Step 0: Purchase Header */}
      {step === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Purchase Details</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Buyer (You)" value={business.name} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Supplier / Seller" value={header.seller_business_id}
                  onChange={(e) => setHeader((h) => ({ ...h, seller_business_id: e.target.value }))} fullWidth>
                  <MenuItem value="">— Unregistered / Unknown Supplier —</MenuItem>
                  {sellers.filter((b) => b.id !== business.id).map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name} ({b.state})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Transaction Type" value={header.transaction_type}
                  onChange={(e) => setHeader((h) => ({ ...h, transaction_type: e.target.value }))} fullWidth>
                  {TX_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
                {header.transaction_type === 'reverse_charge' && (
                  <Alert severity="warning" sx={{ mt: 1, fontSize: '0.78rem' }}>
                    <strong>RCM (Reverse Charge):</strong> You (the buyer) must pay GST directly to the government.
                    You can claim ITC on this RCM payment in the same period.
                  </Alert>
                )}
                {header.transaction_type === 'exempt' && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '0.78rem' }}>
                    <strong>Exempt Purchase:</strong> No GST is charged. <strong>No ITC can be claimed</strong> on exempt purchases.
                  </Alert>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Tax Period" value={header.tax_period_id}
                  onChange={(e) => setHeader((h) => ({ ...h, tax_period_id: e.target.value }))} required fullWidth>
                  {periods.filter((p) => p.status === 'open').map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.month}/{p.year}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {isInterstate && (
                <Grid size={12}>
                  <Alert severity="info" icon={<BsGlobe />}>
                    <strong>Inter-State Purchase</strong> — IGST applies (your state: {business.state}, supplier: {selectedSeller?.state})
                  </Alert>
                </Grid>
              )}
              <Grid size={12}>
                <TextField label="Notes (optional)" value={header.notes} multiline rows={2}
                  onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))} fullWidth />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" endIcon={<BsArrowRight />}
                onClick={() => setStep(1)} disabled={!header.tax_period_id}>
                Items Bought
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Items */}
      {step === 1 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h5" fontWeight={700}>Items Purchased</Typography>
              <Button startIcon={<BsPlusCircle size={16} />} onClick={addItem} variant="outlined" size="small">Add Item</Button>
            </Stack>
            <Stack spacing={2.5}>
              {items.map((item, idx) => {
                const t = calcItemTax(item, isInterstate);
                return (
                  <Card key={item._key} variant="outlined" sx={{ borderColor: 'primary.light' }}>
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
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField label="Item Name" value={item.item_name} fullWidth size="small" required
                            onChange={(e) => updateItem(item._key, 'item_name', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
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
                        <Grid size={{ xs: 4, sm: 3 }}>
                          <TextField label="Qty" type="number" size="small" value={item.qty} fullWidth
                            onChange={(e) => updateItem(item._key, 'qty', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 8, sm: 5 }}>
                          <TextField label="Unit Price (₹)" type="number" size="small" value={item.unit_price} fullWidth
                            onChange={(e) => updateItem(item._key, 'unit_price', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField select label="GST Rate" value={item.tax_rate} size="small" fullWidth
                            onChange={(e) => updateItem(item._key, 'tax_rate', Number(e.target.value))}>
                            {TAX_RATES.map((r) => <MenuItem key={r} value={r}>{r}%{r === 40 ? ' — Luxury/Sin' : ''}</MenuItem>)}
                          </TextField>
                        </Grid>
                      </Grid>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                        <Chip label={`Taxable: ₹${t.taxable.toFixed(0)}`} size="small" variant="outlined" />
                        {t.cgst > 0 && <Chip label={`CGST Paid: ₹${t.cgst.toFixed(0)}`} color="primary" size="small" variant="outlined" />}
                        {t.sgst > 0 && <Chip label={`SGST Paid: ₹${t.sgst.toFixed(0)}`} color="secondary" size="small" variant="outlined" />}
                        {t.igst > 0 && <Chip label={`IGST Paid: ₹${t.igst.toFixed(0)}`} color="info" size="small" variant="outlined" />}
                        <Chip label={`Total: ₹${t.total.toFixed(0)}`} size="small" />
                        {t.itcEligible
                          ? <Chip label="✓ ITC Claimable" color="success" size="small" />
                          : <Chip label="✗ No ITC" color="warning" size="small" />}
                      </Box>
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

      {/* Step 2: Review */}
      {step === 2 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Review Purchase</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={6}><Typography color="text.secondary" fontSize="0.8rem">Buyer (You)</Typography><Typography fontWeight={600}>{business.name}</Typography></Grid>
              <Grid size={6}><Typography color="text.secondary" fontSize="0.8rem">Supplier</Typography><Typography fontWeight={600}>{selectedSeller?.name || 'Unregistered Supplier'}</Typography></Grid>
              <Grid size={6}><Typography color="text.secondary" fontSize="0.8rem">Transaction</Typography><StatusChip status={header.transaction_type} /></Grid>
              <Grid size={6}>
                <Typography color="text.secondary" fontSize="0.8rem">Tax Mode</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {isInterstate ? <BsGlobe size={14} color="#0288d1" /> : <BsGeoAlt size={14} color="#1a3c6e" />}
                  <Typography fontWeight={600} fontSize="0.875rem">{isInterstate ? 'IGST' : 'CGST+SGST'}</Typography>
                </Stack>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Taxable</TableCell>
                    <TableCell align="right">CGST</TableCell>
                    <TableCell align="right">SGST</TableCell>
                    <TableCell align="right">IGST</TableCell>
                    <TableCell align="right">Total Paid</TableCell>
                    <TableCell align="center">ITC</TableCell>
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
                        <TableCell align="center">
                          <Chip label={t.itcEligible ? '✓ Yes' : '✗ No'} color={t.itcEligible ? 'success' : 'warning'} size="small" />
                        </TableCell>
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
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Alert severity="info" sx={{ mt: 2, fontSize: '0.82rem' }}>
              Total ITC claimable this period: <strong>₹{(totals.cgst + totals.sgst + totals.igst).toFixed(2)}</strong>.
              This will offset your GST liability on sales.
            </Alert>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button startIcon={<BsArrowLeft />} onClick={() => setStep(1)}>Back</Button>
              <Button variant="contained" onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <BsCheckCircle size={16} />}>
                {submitting ? 'Recording...' : 'Record Purchase & Claim ITC'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Done */}
      {step === 3 && createdInvoice && (
        <Card sx={{ textAlign: 'center' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <BsCheckCircle size={64} color="#1d4ed8" style={{ marginBottom: 16 }} />
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>Purchase Recorded!</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>{createdInvoice.invoice?.invoice_number}</Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              ITC of <strong>₹{(totals.cgst + totals.sgst + totals.igst).toFixed(2)}</strong> has been added to your ITC ledger.
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="contained" startIcon={<BsReceiptCutoff size={16} />}
                onClick={() => navigate(`/invoices/${createdInvoice.invoice?.id}`)}>View Record</Button>
              <Button variant="outlined" startIcon={<BsArrowLeft size={16} />}
                onClick={() => { setStep(0); setItems([defaultItem()]); setCreatedInvoice(null); }}>Record Another</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

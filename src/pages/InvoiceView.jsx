import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress, Alert, Button, Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { BsPrinter, BsArrowLeft, BsGlobe, BsGeoAlt } from 'react-icons/bs';
import { getInvoice } from '../api/client.js';
import StatusChip from '../components/StatusChip.jsx';

const LOGO_URL = 'https://aadhirasolutions-hacakthon.onrender.com/logo.png';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInvoice(id).then(setInvoice).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!invoice) return null;

  const cgstTotal    = invoice.items?.reduce((s, it) => s + Number(it.cgst), 0) || 0;
  const sgstTotal    = invoice.items?.reduce((s, it) => s + Number(it.sgst), 0) || 0;
  const igstTotal    = invoice.items?.reduce((s, it) => s + Number(it.igst), 0) || 0;
  const taxableTotal = invoice.items?.reduce((s, it) => s + Number(it.taxable_value), 0) || 0;
  const grandTotal   = invoice.items?.reduce((s, it) => s + Number(it.total_value), 0) || 0;

  return (
    <Box maxWidth={960} mx="auto">
      {/* Action bar — hidden on print */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, '@media print': { display: 'none' } }}>
        <Button startIcon={<BsArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</Button>
        <Button variant="outlined" startIcon={<BsPrinter size={16} />} onClick={() => window.print()}>Print Invoice</Button>
      </Stack>

      <Card sx={{ border: '2px solid', borderColor: 'primary.main', '@media print': { boxShadow: 'none', border: '1px solid #ccc' } }}>
        {/* Invoice Header */}
        <Box sx={{ background: 'linear-gradient(135deg,#1a3c6e,#2d5fa0)', color: 'white', p: { xs: 2.5, md: 3.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                component="img" src={LOGO_URL} alt="Aadhira Solutions"
                sx={{ height: { xs: 38, md: 48 }, bgcolor: 'white', borderRadius: 1, p: '3px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box>
                <Typography fontWeight={800} fontSize={{ xs: '1rem', md: '1.25rem' }}>Aadhira Solutions</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', letterSpacing: 1 }}>GST LEARNING SIMULATOR</Typography>
              </Box>
            </Stack>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
                TAX INVOICE
              </Typography>
              <Typography fontWeight={700} fontSize="0.9rem" sx={{ mt: 0.5 }}>{invoice.invoice_number}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
              <Box sx={{ mt: 0.75 }}><StatusChip status={invoice.invoice_type} /></Box>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
          {/* Seller / Buyer */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              { role: 'From (Seller)', name: invoice.seller_name, gstin: invoice.seller_gstin, state: invoice.seller_state },
              { role: 'To (Buyer)', name: invoice.buyer_name || 'B2C Customer', gstin: invoice.buyer_gstin, state: invoice.buyer_state },
            ].map(({ role, name, gstin, state }) => (
              <Grid item xs={12} sm={6} key={role}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} fontSize="0.65rem" letterSpacing={1}>{role}</Typography>
                <Typography variant="h6" fontWeight={700} fontSize={{ xs: '0.95rem', md: '1.1rem' }}>{name}</Typography>
                {gstin && <Typography variant="body2" color="text.secondary" fontSize="0.8rem">GSTIN: {gstin}</Typography>}
                {state && <Typography variant="body2" color="text.secondary" fontSize="0.8rem">State: {state}</Typography>}
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Chip
              size="small"
              icon={invoice.is_interstate ? <BsGlobe size={12} /> : <BsGeoAlt size={12} />}
              label={invoice.is_interstate ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
              color={invoice.is_interstate ? 'info' : 'primary'}
            />
            <Chip size="small" label={invoice.transaction_type} variant="outlined" />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Items Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'background.default', fontSize: '0.78rem' } }}>
                  <TableCell>#</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Taxable</TableCell>
                  <TableCell align="right">CGST</TableCell>
                  <TableCell align="right">SGST</TableCell>
                  <TableCell align="right">IGST</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items?.map((item, idx) => (
                  <TableRow key={item.id} sx={{ '& td': { fontSize: '0.8rem' } }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.hsn_code || '—'}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">₹{Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(item.taxable_value).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(item.cgst).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(item.sgst).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(item.igst).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{Number(item.total_value).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Tax Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Box sx={{ width: { xs: '100%', sm: 320 } }}>
              {[
                { label: 'Taxable Value', value: taxableTotal },
                { label: 'CGST', value: cgstTotal },
                { label: 'SGST', value: sgstTotal },
                { label: 'IGST', value: igstTotal },
              ].map(({ label, value }) => (
                <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography color="text.secondary" fontSize="0.875rem">{label}</Typography>
                  <Typography fontSize="0.875rem">₹{value.toFixed(2)}</Typography>
                </Stack>
              ))}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">₹{grandTotal.toFixed(2)}</Typography>
              </Stack>
            </Box>
          </Box>

          {invoice.notes && <Alert severity="info" sx={{ mt: 2, fontSize: '0.82rem' }}>Notes: {invoice.notes}</Alert>}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center', fontStyle: 'italic' }}>
            ⚠️ This is a simulated invoice for educational purposes only. Not a legal or tax document.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress, Alert, Button, Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { BsPrinter, BsArrowLeft, BsGlobe, BsGeoAlt, BsDownload, BsTruck } from 'react-icons/bs';
import { getInvoice } from '../api/client.js';
import StatusChip from '../components/StatusChip.jsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


const LOGO_URL = '/logo.png';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printableRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [eWayEligible, setEWayEligible] = useState(false);

  useEffect(() => {
    getInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        const total = inv.items?.reduce((s, it) => s + Number(it.total_value || 0), 0) || 0;
        setEWayEligible(total >= 50000);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setDownloading(true);
    try {
      const element = printableRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const margin = 5; // 5mm margin from all sides
      const pageWidth = 210;
      const pageHeight = 297;
      
      const contentWidth = canvas.width;
      const contentHeight = canvas.height;
      
      const maxPdfWidth = pageWidth - (margin * 2);
      const maxPdfHeight = pageHeight - (margin * 2);
      
      let pdfWidth = maxPdfWidth;
      let pdfHeight = (contentHeight * pdfWidth) / contentWidth;
      
      if (pdfHeight > maxPdfHeight) {
        pdfHeight = maxPdfHeight;
        pdfWidth = (contentWidth * pdfHeight) / contentHeight;
      }
      
      const xOffset = margin + (maxPdfWidth - pdfWidth) / 2;
      const yOffset = margin + (maxPdfHeight - pdfHeight) / 2;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const isQuotation = (invoice.document_type || invoice.invoice_type || 'tax_invoice') === 'quotation';
      pdf.save(`${isQuotation ? 'Quotation' : 'Invoice'}_${invoice.invoice_number || 'Simulated'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!invoice) return null;

  const docType = invoice.document_type || invoice.invoice_type || 'tax_invoice';
  const isQuotation = docType === 'quotation';
  const docTypeLabel = {
    tax_invoice: 'TAX INVOICE',
    bill_of_supply: 'BILL OF SUPPLY',
    quotation: 'QUOTATION',
    delivery_challan: 'DELIVERY CHALLAN',
    credit_note: 'CREDIT NOTE',
    debit_note: 'DEBIT NOTE'
  }[docType] || 'TAX INVOICE';

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
          <Stack direction="row" spacing={1.5}>
            {eWayEligible && (
              <Button
                variant="outlined" color="success"
                startIcon={<BsTruck size={16} />}
                onClick={() => navigate(`/ewaybill?invoiceId=${id}`)}
              >
                E-Way Bill
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <BsDownload size={16} />}
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button variant="outlined" startIcon={<BsPrinter size={16} />} onClick={() => window.print()}>Print Invoice</Button>
          </Stack>
        </Stack>

      <Card ref={printableRef} sx={{ border: '2px solid', borderColor: 'primary.main', '@media print': { boxShadow: 'none', border: '1px solid #ccc' } }}>
        {/* Invoice Header */}
        <Box sx={{ bgcolor: '#1a3c6e', color: 'white', p: { xs: 2.5, md: 3.5 } }}>
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
                {docTypeLabel}
              </Typography>
              <Typography fontWeight={700} fontSize="0.9rem" sx={{ mt: 0.5 }}>{invoice.invoice_number}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
              <Box sx={{ mt: 0.75 }}><StatusChip status={docType} /></Box>
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
              <Grid size={{ xs: 12, sm: 6 }} key={role}>
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
                  {!isQuotation && <TableCell align="right">Taxable</TableCell>}
                  {!isQuotation && <TableCell align="right">CGST</TableCell>}
                  {!isQuotation && <TableCell align="right">SGST</TableCell>}
                  {!isQuotation && <TableCell align="right">IGST</TableCell>}
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
                    {!isQuotation && <TableCell align="right">₹{Number(item.taxable_value).toFixed(2)}</TableCell>}
                    {!isQuotation && <TableCell align="right">₹{Number(item.cgst).toFixed(2)}</TableCell>}
                    {!isQuotation && <TableCell align="right">₹{Number(item.sgst).toFixed(2)}</TableCell>}
                    {!isQuotation && <TableCell align="right">₹{Number(item.igst).toFixed(2)}</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{Number(isQuotation ? item.taxable_value : item.total_value).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Tax Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Box sx={{ width: { xs: '100%', sm: 320 } }}>
              {isQuotation ? (
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography color="text.secondary" fontSize="0.875rem">Quotation Total</Typography>
                  <Typography fontSize="0.875rem">₹{taxableTotal.toFixed(2)}</Typography>
                </Stack>
              ) : (
                [
                  { label: 'Taxable Value', value: taxableTotal },
                  { label: 'CGST', value: cgstTotal },
                  { label: 'SGST', value: sgstTotal },
                  { label: 'IGST', value: igstTotal },
                ].map(({ label, value }) => (
                  <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                    <Typography color="text.secondary" fontSize="0.875rem">{label}</Typography>
                    <Typography fontSize="0.875rem">₹{value.toFixed(2)}</Typography>
                  </Stack>
                ))
              )}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ₹{(isQuotation ? taxableTotal : grandTotal).toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          {invoice.notes && <Alert severity="info" sx={{ mt: 2, fontSize: '0.82rem' }}>Notes: {invoice.notes}</Alert>}

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Bank Details & Terms */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                Bank Account Details
              </Typography>
              <Box sx={{ p: 1.2, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider', mb: 1.5 }}>
                <Grid container spacing={0.5} sx={{ '& .MuiTypography-root': { fontSize: '0.72rem' } }}>
                  <Grid size={5.5}><Typography color="text.secondary">Bank Name:</Typography></Grid>
                  <Grid size={6.5}><Typography fontWeight={600}>SBI</Typography></Grid>
                  <Grid size={5.5}><Typography color="text.secondary">A/C No:</Typography></Grid>
                  <Grid size={6.5}><Typography fontWeight={600} fontFamily="monospace" fontSize="0.7rem">33020199485</Typography></Grid>
                  <Grid size={5.5}><Typography color="text.secondary">IFSC Code:</Typography></Grid>
                  <Grid size={6.5}><Typography fontWeight={600} fontFamily="monospace" fontSize="0.7rem">SBIN0000324</Typography></Grid>
                </Grid>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                Terms & Conditions
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3, fontSize: '0.68rem' }}>
                1. Goods sold are non-refundable.<br />
                2. Interest @ 18% p.a. charged after 15 days.
              </Typography>
            </Grid>

            {/* Simulated UPI QR Code */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                Scan to Pay (Simulated)
              </Typography>
              <Box sx={{ p: 1, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=simulate-only@pay&pn=Aadhira%20Solutions&am=${(isQuotation ? taxableTotal : grandTotal).toFixed(2)}&cu=INR`)}`}
                  alt="UPI QR Code"
                  style={{ width: 100, height: 100 }}
                />
                <Typography variant="caption" fontWeight={700} sx={{ mt: 0.5, color: '#1a3c6e', fontSize: '0.68rem' }}>
                  ₹{(isQuotation ? taxableTotal : grandTotal).toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontSize: '0.65rem' }}>
                UPI ID: simulate-only@pay
              </Typography>
            </Grid>

            {/* Declaration & Signature */}
            <Grid size={{ xs: 12, sm: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: { xs: 'left', md: 'right' } }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                  Declaration
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', lineHeight: 1.3, fontSize: '0.68rem' }}>
                  We declare that this document details are true and correct.
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 3, fontSize: '0.8rem' }}>
                  For {invoice.seller_name}
                </Typography>
                <Divider sx={{ width: 150, ml: { xs: 0, md: 'auto' }, mb: 0.5 }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                  Authorized Signatory
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, fontSize: '0.78rem' }}>
              💻 This is a computer-generated {isQuotation ? 'quotation' : 'invoice'} and does not require a physical signature.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', fontSize: '0.7rem' }}>
              ⚠️ Simulated for GST educational sandbox purposes only. Not a legal financial document.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

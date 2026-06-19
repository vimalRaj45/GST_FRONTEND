import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Alert,
  CircularProgress, Button, Divider, Table, TableHead, TableBody,
  TableRow, TableCell, Accordion, AccordionSummary, AccordionDetails, Tab, Tabs
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BsArrowLeft, BsBuilding, BsPerson, BsGlobe, BsFileEarmarkText,
  BsChevronDown, BsInfoCircle, BsCurrencyRupee, BsArrowRight
} from 'react-icons/bs';
import { getBusinessInvoices, getPeriods } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import useProgressStore from '../store/useProgressStore.js';

function SummaryCard({ label, value, sub, color = '#1a3c6e', icon }) {
  return (
    <Box sx={{
      p: { xs: 2, md: 2.5 }, borderRadius: 2,
      border: `1.5px solid ${color}30`, bgcolor: `${color}0a`, textAlign: 'center'
    }}>
      {icon && <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'center' }}>{icon}</Box>}
      <Typography variant="caption" color="text.secondary" display="block" fontSize="0.72rem" mb={0.5}>{label}</Typography>
      <Typography fontWeight={800} sx={{ color, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{sub}</Typography>}
    </Box>
  );
}

export default function Gstr1View() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { business } = useAppStore();
  const { markModule } = useProgressStore();
  const [invoices, setInvoices] = useState([]);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => { markModule('viewedGstr1'); }, []);

  useEffect(() => {
    if (!business?.id) return;
    Promise.all([
      getBusinessInvoices(business.id, id),
      getPeriods(business.id),
    ])
      .then(([invData, periods]) => {
        setInvoices(invData || []);
        const p = periods.find((x) => String(x.id) === String(id));
        setPeriod(p || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [business?.id, id]);

  const { b2b, b2c, exports: exportInv, b2bAmounts, b2cAmounts, exportAmounts } = useMemo(() => {
    const outward = invoices.filter((inv) => String(inv.seller_id || '') === String(business?.id || ''));
    const b2b = outward.filter((inv) => inv.buyer_gstin);
    const b2c = outward.filter((inv) => !inv.buyer_gstin && inv.transaction_type !== 'export');
    const exports = outward.filter((inv) => inv.transaction_type === 'export');

    const sumAmounts = (arr) => ({
      taxable: arr.reduce((s, inv) => s + inv.items?.reduce((a, it) => a + Number(it.taxable_value || 0), 0), 0),
      cgst: arr.reduce((s, inv) => s + inv.items?.reduce((a, it) => a + Number(it.cgst || 0), 0), 0),
      sgst: arr.reduce((s, inv) => s + inv.items?.reduce((a, it) => a + Number(it.sgst || 0), 0), 0),
      igst: arr.reduce((s, inv) => s + inv.items?.reduce((a, it) => a + Number(it.igst || 0), 0), 0),
      total: arr.reduce((s, inv) => s + inv.items?.reduce((a, it) => a + Number(it.total_value || 0), 0), 0),
    });

    return {
      b2b, b2c, exports,
      b2bAmounts: sumAmounts(b2b),
      b2cAmounts: sumAmounts(b2c),
      exportAmounts: sumAmounts(exports),
    };
  }, [invoices, business?.id]);

  const grandTaxable = b2bAmounts.taxable + b2cAmounts.taxable + exportAmounts.taxable;
  const grandTax = b2bAmounts.cgst + b2bAmounts.sgst + b2bAmounts.igst + b2cAmounts.cgst + b2cAmounts.sgst + b2cAmounts.igst;
  const grandTotal = b2bAmounts.total + b2cAmounts.total + exportAmounts.total;

  // HSN Summary
  const hsnSummary = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      (inv.items || []).forEach((it) => {
        const key = it.hsn_code || 'N/A';
        if (!map[key]) map[key] = { hsn: key, desc: it.description || 'Unknown', taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        map[key].taxable += Number(it.taxable_value || 0);
        map[key].cgst += Number(it.cgst || 0);
        map[key].sgst += Number(it.sgst || 0);
        map[key].igst += Number(it.igst || 0);
        map[key].total += Number(it.total_value || 0);
      });
    });
    return Object.values(map);
  }, [invoices]);

  if (!business) return <Alert severity="warning">Please register a business first.</Alert>;
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const tabs = ['Overview', 'B2B Supplies', 'B2C Supplies', 'Exports', 'HSN Summary'];

  return (
    <Box maxWidth={1000} mx="auto">
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<BsArrowLeft size={16} />} onClick={() => navigate('/periods')}>Back to Periods</Button>
        {period && (
          <Chip
            label={`${period.month}/${period.year} — ${period.status?.toUpperCase()}`}
            color={period.status === 'filed' ? 'success' : 'warning'}
            size="small" fontWeight={700}
          />
        )}
      </Stack>

      <ExplainerCallout title="What is GSTR-1?">
        <strong>GSTR-1</strong> is the monthly return for <strong>outward supplies</strong> (your sales).
        It's filed by the 11th of the following month. Your buyers can then claim ITC based on your GSTR-1 data.
        GSTR-3B (summary return) is filed by the 20th and covers net tax payable after ITC.
      </ExplainerCallout>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BsFileEarmarkText size={26} color="#1a3c6e" />
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.8rem' } }}>
            GSTR-1 — Outward Supply Return
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {business.name} · Period: {period ? `${period.month}/${period.year}` : 'N/A'}
          </Typography>
        </Box>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Invoices" value={invoices.length} color="#1a3c6e"
            icon={<BsFileEarmarkText size={20} color="#1a3c6e" />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Taxable Value" value={`₹${grandTaxable.toFixed(0)}`} color="#0288d1"
            icon={<BsCurrencyRupee size={20} color="#0288d1" />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Tax Collected" value={`₹${grandTax.toFixed(0)}`} color="#e07b00"
            icon={<BsCurrencyRupee size={20} color="#e07b00" />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Invoice Total" value={`₹${grandTotal.toFixed(0)}`} color="#2e7d32"
            icon={<BsCurrencyRupee size={20} color="#2e7d32" />} />
        </Grid>
      </Grid>

      {/* Supply Type Breakdown */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'B2B (Registered Buyers)', count: b2b.length, tax: b2bAmounts.cgst + b2bAmounts.sgst + b2bAmounts.igst, color: '#1a3c6e', icon: <BsBuilding size={18} /> },
          { label: 'B2C (Unregistered / Retail)', count: b2c.length, tax: b2cAmounts.cgst + b2cAmounts.sgst + b2cAmounts.igst, color: '#2e7d32', icon: <BsPerson size={18} /> },
          { label: 'Exports (Zero-rated)', count: exportInv.length, tax: 0, color: '#0288d1', icon: <BsGlobe size={18} /> },
        ].map(({ label, count, tax, color, icon }) => (
          <Grid size={{ xs: 12, sm: 4 }} key={label}>
            <Box sx={{ p: 2.5, borderRadius: 2, border: `2px solid ${color}30`, bgcolor: `${color}08`, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ color }}>{icon}</Box>
                <Typography fontWeight={700} fontSize="0.85rem">{label}</Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} sx={{ color, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{count}</Typography>
              <Typography variant="caption" color="text.secondary">Invoices · Tax: ₹{tax.toFixed(2)}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {tabs.map((t) => <Tab key={t} label={t} sx={{ fontWeight: 600, fontSize: '0.82rem' }} />)}
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Overview Tab */}
          {tab === 0 && (
            <Stack spacing={2}>
              <Alert severity="info" icon={<BsInfoCircle />}>
                GSTR-1 is auto-generated when you <strong>Close a Period</strong>. Your buyers see your B2B invoices
                in their GSTR-2A and can claim ITC only after you file GSTR-1.
              </Alert>
              {[
                { section: '4A — B2B Taxable Supplies', data: b2bAmounts, count: b2b.length, color: '#1a3c6e', desc: 'Invoices raised to GST-registered businesses' },
                { section: '5 — B2C Taxable Supplies', data: b2cAmounts, count: b2c.length, color: '#2e7d32', desc: 'Invoices raised to unregistered buyers (retail)' },
                { section: '6A — Exports (Zero-rated)', data: exportAmounts, count: exportInv.length, color: '#0288d1', desc: 'No GST charged; ITC on inputs still claimable' },
              ].map(({ section, data, count, color, desc }) => (
                <Box key={section} sx={{ p: 2.5, borderRadius: 2, border: `1.5px solid ${color}25`, bgcolor: `${color}06` }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.9rem" sx={{ color }}>{section}</Typography>
                      <Typography variant="caption" color="text.secondary">{desc}</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary" display="block">Invoices</Typography>
                        <Typography fontWeight={700}>{count}</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary" display="block">Taxable</Typography>
                        <Typography fontWeight={700}>₹{data.taxable.toFixed(0)}</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary" display="block">CGST</Typography>
                        <Typography fontWeight={700}>₹{data.cgst.toFixed(0)}</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary" display="block">SGST</Typography>
                        <Typography fontWeight={700}>₹{data.sgst.toFixed(0)}</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary" display="block">IGST</Typography>
                        <Typography fontWeight={700}>₹{data.igst.toFixed(0)}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          {/* B2B Tab */}
          {tab === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.82rem' }}>
                <strong>B2B invoices</strong> are auto-populated in your buyer's GSTR-2A. Buyer can claim ITC only after you file this return.
              </Alert>
              {b2b.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No B2B invoices in this period.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        {['Invoice #', 'Buyer', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {b2b.map((inv) => {
                        const tx = inv.items?.reduce((a, it) => a + Number(it.taxable_value || 0), 0) || 0;
                        const cg = inv.items?.reduce((a, it) => a + Number(it.cgst || 0), 0) || 0;
                        const sg = inv.items?.reduce((a, it) => a + Number(it.sgst || 0), 0) || 0;
                        const ig = inv.items?.reduce((a, it) => a + Number(it.igst || 0), 0) || 0;
                        const tot = inv.items?.reduce((a, it) => a + Number(it.total_value || 0), 0) || 0;
                        return (
                          <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{inv.invoice_number}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{inv.buyer_name || 'N/A'}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{inv.buyer_gstin || '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{tx.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{cg.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{sg.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{ig.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>₹{tot.toFixed(0)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}

          {/* B2C Tab */}
          {tab === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.82rem' }}>
                <strong>B2C (retail) invoices</strong> are consolidated in GSTR-1 as a lump sum. Buyers cannot claim ITC.
              </Alert>
              {b2c.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No B2C invoices in this period.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        {['Invoice #', 'Buyer', 'Type', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {b2c.map((inv) => {
                        const tx = inv.items?.reduce((a, it) => a + Number(it.taxable_value || 0), 0) || 0;
                        const cg = inv.items?.reduce((a, it) => a + Number(it.cgst || 0), 0) || 0;
                        const sg = inv.items?.reduce((a, it) => a + Number(it.sgst || 0), 0) || 0;
                        const ig = inv.items?.reduce((a, it) => a + Number(it.igst || 0), 0) || 0;
                        const tot = inv.items?.reduce((a, it) => a + Number(it.total_value || 0), 0) || 0;
                        return (
                          <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{inv.invoice_number}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{inv.buyer_name || 'Retail Customer'}</TableCell>
                            <TableCell><Chip label="B2C" size="small" color="success" sx={{ fontSize: '0.68rem' }} /></TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{tx.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{cg.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{sg.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>₹{ig.toFixed(0)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>₹{tot.toFixed(0)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}

          {/* Exports Tab */}
          {tab === 3 && (
            <Box>
              <Alert severity="success" sx={{ mb: 2, fontSize: '0.82rem' }}>
                <strong>Exports are zero-rated</strong> — no GST is charged to the foreign buyer. However, you can still
                claim ITC on inputs used to make the exported goods.
              </Alert>
              {exportInv.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No export invoices in this period.</Typography>
              ) : (
                exportInv.map((inv) => (
                  <Box key={inv.id} sx={{ p: 2, border: '1.5px solid #0288d130', borderRadius: 2, mb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontWeight={700}>{inv.invoice_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{inv.buyer_name}</Typography>
                      </Box>
                      <Stack direction="row" spacing={2}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary" display="block">Taxable</Typography>
                          <Typography fontWeight={700}>₹{inv.items?.reduce((a, it) => a + Number(it.taxable_value || 0), 0).toFixed(0)}</Typography>
                        </Box>
                        <Chip label="Zero-rated" size="small" color="info" />
                      </Stack>
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          )}

          {/* HSN Summary Tab */}
          {tab === 4 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, fontSize: '0.82rem' }}>
                <strong>HSN Summary</strong> (Table 12 of GSTR-1) is mandatory for businesses with turnover above ₹1.5 crore.
                It groups your supplies by HSN code and shows the rate-wise tax breakdown.
              </Alert>
              {hsnSummary.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No HSN data available.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        {['HSN Code', 'Description', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hsnSummary.map((row) => (
                        <TableRow key={row.hsn} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem' }}>{row.hsn}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>{row.desc}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>₹{row.taxable.toFixed(0)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>₹{row.cgst.toFixed(0)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>₹{row.sgst.toFixed(0)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>₹{row.igst.toFixed(0)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3c6e' }}>₹{(row.cgst + row.sgst + row.igst).toFixed(0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
                <strong>Note:</strong> HSN codes must be 4-digit for turnover between ₹1.5–5 crore, and 6-digit for above ₹5 crore.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Next Step CTA */}
      {period?.status === 'closed' && (
        <Card sx={{ mt: 3, border: '2px solid #2e7d3240', bgcolor: '#e8f5e9' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
              <Box>
                <Typography fontWeight={700} color="#2e7d32">GSTR-1 Reviewed ✓</Typography>
                <Typography variant="body2" color="#1b5e20">Next: File your GSTR-3B to pay net tax and unlock buyer ITC.</Typography>
              </Box>
              <Button
                variant="contained" color="success" endIcon={<BsArrowRight />}
                onClick={() => navigate(`/periods/${id}/file`)}
              >
                File GSTR-3B
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

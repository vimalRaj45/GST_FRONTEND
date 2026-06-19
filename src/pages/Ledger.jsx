import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Alert, CircularProgress, Stack, MenuItem, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip,
  Skeleton, Card
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BsStars, BsWallet2, BsXCircle } from 'react-icons/bs';
import { getITCSummary, getPeriods, explainITCStatus } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import StatusChip from '../components/StatusChip.jsx';
import useProgressStore from '../store/useProgressStore.js';

export default function Ledger() {
  const { business } = useAppStore();
  const { markModule } = useProgressStore();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explainDialog, setExplainDialog] = useState({ open: false, entryId: null });
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => { markModule('viewedLedger'); }, []);

  useEffect(() => {
    if (business?.id) {
      getPeriods(business.id).then((p) => {
        setPeriods(p);
        const open = p.find((x) => x.status === 'open');
        if (open) setSelectedPeriod(open.id);
      }).catch(() => {});
    }
  }, [business?.id]);

  useEffect(() => {
    if (business?.id && selectedPeriod) {
      setLoading(true); setError(null);
      getITCSummary(business.id, selectedPeriod).then(setSummary).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }
  }, [business?.id, selectedPeriod]);

  const handleExplain = useCallback(async (entryId) => {
    setExplainDialog({ open: true, entryId }); setExplanation(null); setExplaining(true);
    try { const res = await explainITCStatus(entryId); setExplanation(res.explanation); }
    catch (err) { setExplanation(`Error: ${err.message}`); }
    finally { setExplaining(false); }
  }, []);

  if (!business) return <Alert severity="warning" action={<Button href="/register">Register</Button>}>Please register a business first.</Alert>;

  // Composition scheme warning
  const isComposition = business.scheme_type === 'composition';

  const columns = [
    {
      field: 'entry_type', headerName: 'Type', width: 100,
      renderCell: (p) => <Chip label={p.value === 'input' ? '⬇ Input' : '⬆ Output'} size="small" color={p.value === 'input' ? 'success' : 'primary'} />,
    },
    { field: 'invoice_number', headerName: 'Invoice #', width: 155 },
    { field: 'seller_name', headerName: 'Seller', flex: 1, minWidth: 130 },
    { field: 'buyer_name',  headerName: 'Buyer',  flex: 1, minWidth: 130 },
    { field: 'amount',      headerName: 'Tax (₹)', width: 120, type: 'number', valueFormatter: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { field: 'cgst_amount', headerName: 'CGST',    width: 90,  type: 'number', valueFormatter: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { field: 'sgst_amount', headerName: 'SGST',    width: 90,  type: 'number', valueFormatter: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { field: 'igst_amount', headerName: 'IGST',    width: 90,  type: 'number', valueFormatter: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { field: 'match_status', headerName: 'Status',  width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    {
      field: 'actions', headerName: 'AI', width: 110, sortable: false,
      renderCell: (p) => (
        p.row.match_status !== 'matched'
          ? <Button size="small" startIcon={<BsStars size={13} />} onClick={() => handleExplain(p.row.id)} sx={{ fontSize: '0.72rem' }}>Explain</Button>
          : null
      ),
    },
  ];

  const summaryCards = summary
    ? [
        { label: 'Output Tax (Sales)', value: summary.outputTax, color: '#1a3c6e' },
        { label: 'Matched ITC',        value: summary.matchedITC, color: '#2e7d32' },
        { label: 'Pending ITC',        value: summary.pendingITC, color: '#ed6c02' },
        { label: 'Net Payable',        value: summary.netPayable, color: '#c62828' },
        { label: 'Carry Forward',      value: summary.carryForward, color: '#0288d1' },
      ]
    : [];

  return (
    <Box>
      {isComposition && (
        <Alert severity="warning" sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
          <Typography fontWeight={700}>🏪 Composition Scheme — ITC Not Claimable</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>{business.name}</strong> is registered under the <strong>Composition Scheme</strong>.
            Composition dealers <strong>cannot claim Input Tax Credit</strong> on purchases.
            They pay a flat rate on turnover and issue Bill of Supply (not Tax Invoices).
            This ledger shows your outward tax liability only.
          </Typography>
        </Alert>
      )}
      <ExplainerCallout title="Input Tax Credit (ITC) Ledger">
        ITC is how GST paid on purchases offsets GST collected on sales.
        <strong> Matched</strong> = seller filed GSTR-1, your claim is confirmed.
        <strong> Pending</strong> = waiting for seller to file.
        <strong> Blocked</strong> = not claimable (composition, exempt, etc.).
        Net Payable = Output Tax − Matched ITC.
      </ExplainerCallout>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <BsWallet2 size={22} color="#1a3c6e" />
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', md: '1.75rem' } }}>
            ITC Ledger — {business.name}
          </Typography>
        </Stack>
        <TextField select label="Tax Period" value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          sx={{ minWidth: 190 }} size="small">
          {periods.map((p) => <MenuItem key={p.id} value={p.id}>{p.month}/{p.year} — {p.status}</MenuItem>)}
        </TextField>
      </Stack>

      {/* Summary Cards */}
      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' }, gap: 2, mb: 3 }}>
          {summaryCards.map(({ label, value, color }) => (
            <Box key={label} sx={{ textAlign: 'center', p: { xs: 1.5, md: 2 }, borderRadius: 2, border: `2px solid ${color}33`, bgcolor: `${color}0d` }}>
              <Typography variant="caption" color="text.secondary" fontSize="0.72rem" display="block">{label}</Typography>
              <Typography fontWeight={800} sx={{ color, fontSize: { xs: '1rem', md: '1.15rem' } }}>₹{Number(value || 0).toFixed(0)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error   && <Alert severity="error">{error}</Alert>}

      {summary && !loading && (
        <Card>
          <Box sx={{ height: { xs: 400, md: 500 } }}>
            <DataGrid
              rows={summary.entries || []} columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{ bgcolor: 'background.paper', border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' } }}
            />
          </Box>
        </Card>
      )}

      {/* AI Explanation Dialog */}
      <Dialog open={explainDialog.open} onClose={() => setExplainDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <BsStars color="#e07b00" size={20} />
          <Typography fontWeight={700}>AI Explanation — Mistral</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {explaining ? (
            <Stack spacing={1.5}>
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={20} width="70%" />
              <Typography variant="caption" color="text.secondary">Asking Mistral AI to explain this ITC entry...</Typography>
            </Stack>
          ) : (
            <Typography variant="body1" sx={{ lineHeight: 1.85 }}>{explanation}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<BsXCircle size={15} />} onClick={() => setExplainDialog({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

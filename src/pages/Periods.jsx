import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Alert, CircularProgress, Card, Stack, Snackbar, useMediaQuery, useTheme
} from '@mui/material';
import {
  BsLock, BsFileEarmarkText, BsArrowRepeat, BsCalendarCheck,
  BsCheckCircle, BsEyeFill
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { getPeriods, closePeriod } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';
import StatusChip from '../components/StatusChip.jsx';

export default function Periods() {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { business, isTourActive, tourStep } = useAppStore();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  const loadPeriods = () => {
    if (!business?.id) return;
    setLoading(true);
    getPeriods(business.id).then(setPeriods).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(loadPeriods, [business?.id]);

  const handleClose = async (period) => {
    setClosingId(period.id);
    setPeriods((prev) => prev.map((p) => p.id === period.id ? { ...p, status: 'closed', _optimistic: true } : p));
    try {
      const res = await closePeriod(period.id, business.id);
      const msg = res.alreadyClosed
        ? `Period ${period.month}/${period.year} was already closed.`
        : `Period ${period.month}/${period.year} closed! GSTR-1 generated.`;
      setSnack({ open: true, message: msg, severity: res.alreadyClosed ? 'info' : 'success' });
      loadPeriods();
    } catch (err) {
      setPeriods((prev) => prev.map((p) => p.id === period.id ? { ...p, status: 'open', _optimistic: false } : p));
      setSnack({ open: true, message: err.message || 'Failed to close period', severity: 'error' });
    } finally {
      setClosingId(null);
    }
  };

  // Auto-Pilot Logic - Robust Polling Mechanism
  useEffect(() => {
    if (!isTourActive || tourStep !== 4) return;
    
    const interval = setInterval(() => {
      // Check for errors
      if (error || snack.severity === 'error') {
        clearInterval(interval);
        return;
      }
      
      // We need periods to be loaded
      if (!periods || periods.length === 0) return;
      
      const closedPeriod = periods.find(p => p.status === 'closed');
      const openPeriod = periods.find(p => p.status === 'open');
      
      if (closedPeriod) {
        // Find the button in the DOM directly
        const btn = document.getElementById(`file-return-btn-${closedPeriod.id}`);
        if (btn && !btn.disabled) {
          clearInterval(interval); // Stop polling once we click
          btn.click();
        } else if (!btn) {
          // Fallback if button is missing from DOM for some reason
          clearInterval(interval);
          navigate(`/periods/${closedPeriod.id}/file`);
        }
      } else if (openPeriod && !closingId) {
        const btn = document.getElementById(`close-period-btn-${openPeriod.id}`);
        if (btn && !btn.disabled) {
          // We don't clear interval here because we want it to keep polling
          // so it can catch the 'closed' state after this finishes!
          btn.click();
        } else if (!btn) {
          handleClose(openPeriod);
        }
      }
    }, 1500); // Poll every 1.5s
    
    return () => clearInterval(interval);
  }, [isTourActive, tourStep, periods, closingId, error, snack.severity, navigate]);

  if (!business) return <Alert severity="warning">Please register a business first.</Alert>;

  return (
    <Box>
      <ExplainerCallout title="Tax Periods & Monthly Returns">
        GST is a monthly cycle. Transactions accumulate in an <strong>Open</strong> period.
        <strong>Close</strong> → generates GSTR-1 (outward supplies).
        <strong>File</strong> → creates GSTR-3B, offsets ITC, marks buyers' entries as Matched, computes late penalty.
      </ExplainerCallout>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <BsCalendarCheck size={22} color="#1a3c6e" />
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', md: '1.75rem' } }}>
            Tax Periods — {business.name}
          </Typography>
        </Stack>
        <Button variant="outlined" size="small" startIcon={<BsArrowRepeat size={15} />} onClick={loadPeriods}>
          Refresh
        </Button>
      </Stack>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error   && <Alert severity="error">{error}</Alert>}

      {/* Mobile card view */}
      {isMobile ? (
        <Stack spacing={2}>
          {periods.map((p) => (
            <Card key={p.id} sx={{ p: 2, opacity: p._optimistic ? 0.7 : 1, border: '1.5px solid', borderColor: p.status === 'open' ? 'warning.main' : p.status === 'filed' ? 'success.main' : 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography fontWeight={800} fontSize="1.1rem">{p.month}/{p.year}</Typography>
                <StatusChip status={p.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block">Deadline: {new Date(p.deadline_date).toLocaleDateString('en-IN')}</Typography>
              {p.net_payable != null && <Typography variant="caption" display="block">Net Payable: <strong>₹{Number(p.net_payable).toFixed(2)}</strong></Typography>}
              <Box sx={{ mt: 1.5 }}>
                {p.status === 'open' && (
                  <Button id={`close-period-btn-${p.id}`} fullWidth variant="contained" color="warning" size="small"
                    startIcon={closingId === p.id ? <CircularProgress size={14} color="inherit" /> : <BsLock size={14} />}
                    disabled={closingId === p.id} onClick={() => handleClose(p)}>
                    {closingId === p.id ? 'Closing...' : 'Close Period'}
                  </Button>
                )}
                {p.status === 'closed' && (
                  <Button id={`file-return-btn-${p.id}`} fullWidth variant="contained" color="success" size="small"
                    startIcon={<BsFileEarmarkText size={14} />}
                    onClick={() => navigate(`/periods/${p.id}/file`)}>
                    File Return
                  </Button>
                )}
                {(p.status === 'filed' || p.status === 'late') && (
                  <Button fullWidth variant="outlined" size="small"
                    startIcon={<BsEyeFill size={14} />}
                    onClick={() => navigate(`/periods/${p.id}/file`)}>
                    View Filing
                  </Button>
                )}
              </Box>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Desktop table view */
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Deadline</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>GSTR-1</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>GSTR-3B</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Net Payable</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((p) => (
                  <TableRow key={p.id} sx={{ opacity: p._optimistic ? 0.7 : 1 }}>
                    <TableCell>
                      <Typography fontWeight={700}>{p.month}/{p.year}</Typography>
                      {p._optimistic && <Typography variant="caption" color="warning.main">Saving...</Typography>}
                    </TableCell>
                    <TableCell>{new Date(p.deadline_date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell><StatusChip status={p.status} /></TableCell>
                    <TableCell>{p.gstr1_id ? <BsCheckCircle color="#2e7d32" size={18} /> : <Typography color="text.disabled">—</Typography>}</TableCell>
                    <TableCell>{p.gstr3b_id ? <StatusChip status={p.is_late ? 'late' : 'filed'} /> : <Typography color="text.disabled">—</Typography>}</TableCell>
                    <TableCell>
                      {p.net_payable != null ? (
                        <Box>
                          <Typography fontWeight={600}>₹{Number(p.net_payable).toFixed(2)}</Typography>
                          {p.carry_forward > 0 && <Typography variant="caption" color="info.main">+₹{Number(p.carry_forward).toFixed(2)} carry fwd</Typography>}
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {p.status === 'open' && (
                          <Button id={`close-period-btn-${p.id}`} size="small" variant="contained" color="warning"
                            startIcon={closingId === p.id ? <CircularProgress size={12} color="inherit" /> : <BsLock size={13} />}
                            disabled={closingId === p.id} onClick={() => handleClose(p)}>
                            {closingId === p.id ? 'Closing...' : 'Close'}
                          </Button>
                        )}
                        {p.status === 'closed' && (
                          <Button id={`file-return-btn-${p.id}`} size="small" variant="contained" color="success"
                            startIcon={<BsFileEarmarkText size={13} />}
                            onClick={() => navigate(`/periods/${p.id}/file`)}>
                            File Return
                          </Button>
                        )}
                        {(p.status === 'filed' || p.status === 'late') && (
                          <Button size="small" variant="outlined" startIcon={<BsEyeFill size={13} />}
                            onClick={() => navigate(`/periods/${p.id}/file`)}>
                            View
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

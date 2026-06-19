import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Stepper, Step, StepLabel, Button, Card, CardContent,
  Grid, Stack, Alert, CircularProgress, Divider
} from '@mui/material';
import {
  BsExclamationTriangle, BsCheckCircle, BsArrowLeft,
  BsArrowRight, BsFileEarmarkText, BsCalendarCheck
} from 'react-icons/bs';
import { useParams, useNavigate } from 'react-router-dom';
import { getFilingPreview, filePeriod } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';

export default function FilingReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { business, isTourActive, tourStep, nextTourStep } = useAppStore();
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filing, setFiling] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!business?.id) return;
    getFilingPreview(id, business.id).then(setPreview).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, business?.id]);

  const autoPilotTimer = React.useRef(null);

  // Auto-Pilot Logic
  useEffect(() => {
    if (error) return; // Stop on error
    if (isTourActive && tourStep === 4) {
      if (step === 0 && preview) {
        if (!autoPilotTimer.current) {
          autoPilotTimer.current = setTimeout(() => { autoPilotTimer.current = null; setStep(1); }, 2000);
        }
      } else if (step === 1) {
        if (!autoPilotTimer.current) {
          autoPilotTimer.current = setTimeout(() => { autoPilotTimer.current = null; setStep(2); }, 2000);
        }
      } else if (step === 2 && !filing && !result) {
        if (!autoPilotTimer.current) {
          autoPilotTimer.current = setTimeout(() => {
            autoPilotTimer.current = null;
            document.getElementById('auto-file-btn')?.click();
          }, 2000);
        }
      }
    }
    // Do not return a cleanup function here, otherwise re-renders will cancel the timer!
  }, [isTourActive, tourStep, step, preview, filing, result, error]);

  // Cleanup timer only on unmount
  useEffect(() => {
    return () => {
      if (autoPilotTimer.current) clearTimeout(autoPilotTimer.current);
    };
  }, []);

  // Handle tour progression on success
  useEffect(() => {
    if (isTourActive && tourStep === 4 && result) {
      const timer = setTimeout(() => nextTourStep(), 3000);
      return () => clearTimeout(timer);
    }
  }, [result, isTourActive, tourStep, nextTourStep]);

  const handleFile = async () => {
    setFiling(true); setError(null);
    try {
      const res = await filePeriod(id, business.id);
      if (res.alreadyFiled) { setError('This period was already filed.'); setResult(res); }
      else { setResult(res); setStep(3); }
    } catch (err) {
      setError(err.message);
    } finally {
      setFiling(false);
    }
  };

  if (!business) return <Alert severity="warning">Please register a business first.</Alert>;
  if (loading)   return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error && !preview) return <Alert severity="error">{error}</Alert>;

  const steps = ['GSTR-3B Summary', 'Penalty Check', 'Confirm & File'];

  return (
    <Box maxWidth={780} mx="auto">
      <ExplainerCallout title="Filing GSTR-3B">
        GSTR-3B is the monthly summary return. Report output tax (sales), claim ITC (purchases), pay net tax.
        Filing after the 20th of next month incurs 18% p.a. interest + ₹50/day penalty (max ₹5,000).
      </ExplainerCallout>

      {/* Stepper */}
      <Box sx={{ overflowX: 'auto', mb: 4 }}>
        <Stepper activeStep={step} sx={{ minWidth: 360 }}>
          {[...steps, 'Done'].map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Step 0: GSTR-3B Summary ── */}
      {step === 0 && preview && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <BsFileEarmarkText size={22} color="#1a3c6e" />
              <Typography variant="h5" fontWeight={700}>
                GSTR-3B Summary — {preview.period?.month}/{preview.period?.year}
              </Typography>
            </Stack>

            <Stack spacing={2} sx={{ mb: 3 }}>
              {[
                { label: '3.1  Output Tax on Sales', value: preview.outputTax, color: '#1a3c6e', desc: 'GST collected from customers' },
                { label: '4.   Matched ITC (claimable)', value: preview.matchedITC, color: '#2e7d32', desc: 'Confirmed by supplier GSTR-1' },
                { label: '     Pending ITC (not claimable)', value: preview.pendingITC, color: '#ed6c02', desc: 'Supplier not yet filed' },
              ].map(({ label, value, color, desc }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, border: '1.5px solid', borderColor: `${color}30`, bgcolor: `${color}08` }}>
                  <Box>
                    <Typography fontWeight={600} fontSize="0.9rem">{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
                    ₹{Number(value || 0).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, bgcolor: preview.netPayable > 0 ? '#ffebee' : '#e8f5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Net Tax Payable</Typography>
                <Typography variant="body2" color="text.secondary">Output Tax − Matched ITC</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color={preview.netPayable > 0 ? 'error.main' : 'success.main'} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                ₹{Number(preview.netPayable || 0).toFixed(2)}
              </Typography>
            </Box>

            {preview.carryForward > 0 && (
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                💡 Your ITC exceeds output tax. <strong>₹{Number(preview.carryForward).toFixed(2)}</strong> will carry forward to the next period.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" endIcon={<BsArrowRight />} onClick={() => setStep(1)}>
                Check Penalty
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: Penalty ── */}
      {step === 1 && preview && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <BsCalendarCheck size={22} color="#1a3c6e" />
              <Typography variant="h5" fontWeight={700}>Penalty Review</Typography>
            </Stack>

            {preview.isLate ? (
              <Alert severity="error" icon={<BsExclamationTriangle />} sx={{ mb: 2 }}>
                <Typography fontWeight={700}>Late Filing — {preview.daysOverdue} days overdue</Typography>
              </Alert>
            ) : (
              <Alert severity="success" icon={<BsCheckCircle />} sx={{ mb: 2 }}>
                Filing on time — No penalty applies! ✅
              </Alert>
            )}

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {[
                { label: 'Filing Deadline', value: new Date(preview.period?.deadline_date).toLocaleDateString('en-IN') },
                { label: 'Days Overdue',    value: preview.daysOverdue || 0 },
                { label: 'Interest (18% p.a.)', value: `₹${Number(preview.interest || 0).toFixed(2)}` },
                { label: 'Late Penalty',    value: `₹${Number(preview.penalty || 0).toFixed(2)}` },
                { label: 'Net Tax Payable', value: `₹${Number(preview.netPayable || 0).toFixed(2)}` },
              ].map(({ label, value }) => (
                <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography color="text.secondary" fontSize="0.875rem">{label}</Typography>
                  <Typography fontWeight={600} fontSize="0.875rem">{value}</Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                <Typography variant="h6" fontWeight={700}>Total Due</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">
                  ₹{(Number(preview.netPayable || 0) + Number(preview.interest || 0) + Number(preview.penalty || 0)).toFixed(2)}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Button startIcon={<BsArrowLeft />} onClick={() => setStep(0)}>Back</Button>
              <Button variant="contained" endIcon={<BsArrowRight />} onClick={() => setStep(2)}>Proceed to File</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 2 && preview && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 4 }, textAlign: 'center' }}>
            <BsFileEarmarkText size={48} color="#1a3c6e" style={{ marginBottom: 16 }} />
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Confirm Filing</Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto', fontSize: '0.9rem' }}>
              Filing GSTR-3B for <strong>{preview.period?.month}/{preview.period?.year}</strong> will lock the period
              and mark all related buyer ITC entries as <strong>Matched</strong>.
            </Typography>

            <Box sx={{ p: 3, bgcolor: 'background.default', borderRadius: 3, mb: 3, display: 'inline-block' }}>
              <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
                ₹{Number(preview.netPayable || 0).toFixed(2)}
              </Typography>
              <Typography color="text.secondary" fontSize="0.8rem">Simulated tax payment — no real money</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="outlined" startIcon={<BsArrowLeft />} onClick={() => setStep(1)}>Back</Button>
              <Button
                id="auto-file-btn"
                variant="contained" color="success" size="large"
                disabled={filing}
                startIcon={filing ? <CircularProgress size={18} color="inherit" /> : <BsCheckCircle size={18} />}
                onClick={handleFile}
              >
                {filing ? 'Filing...' : 'File GSTR-3B'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && result && (
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
            <BsCheckCircle size={72} color="#2e7d32" style={{ marginBottom: 16 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {result.period?.status === 'late' ? 'Return Filed (Late)' : 'Return Filed! 🎉'}
            </Typography>
            {result.summary?.isLate && (
              <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
                Late filing: ₹{result.summary.penalty} penalty + ₹{result.summary.interest} interest applied.
              </Alert>
            )}
            <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
              All buyer ITC entries for this period are now <strong>Matched</strong>.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="contained" onClick={() => navigate('/ledger')}>View ITC Ledger</Button>
              <Button variant="outlined" onClick={() => navigate('/periods')}>All Periods</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

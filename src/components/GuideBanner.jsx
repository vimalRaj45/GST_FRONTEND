import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, Collapse, IconButton,
  CircularProgress, Alert, Chip, LinearProgress, Divider
} from '@mui/material';
import {
  BsChevronDown, BsChevronUp, BsArrowRight, BsArrowLeft,
  BsX, BsLightbulb, BsCheckCircleFill, BsXCircleFill,
  BsGeoAlt, BsExclamationCircle, BsBook, BsTrophy, BsListCheck, BsJournalText
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useGuideStore } from '../store/useGuideStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { GUIDE_SCENARIOS } from './guideScenarios.js';

export default function GuideBanner() {
  const navigate = useNavigate();
  const { business } = useAppStore();
  const {
    active, scenario, stepIdx, stepState, feedback,
    nextStep, stopGuide, setStepState, completeScenario, startScenario
  } = useGuideStore();

  const [expanded, setExpanded] = useState(true);
  const [hintOpen, setHintOpen] = useState(false);

  if (!active || !scenario) return null;

  const steps = scenario.steps;
  const totalSteps = steps.length;
  const isLastStep = stepIdx >= totalSteps - 1;
  const isDone = stepState === 'done';
  const step = isDone ? null : steps[stepIdx];
  const progress = Math.round((stepIdx / totalSteps) * 100);

  const currentScenarioIdx = GUIDE_SCENARIOS.findIndex(s => s.id === scenario.id);
  const nextScenario = currentScenarioIdx !== -1 && currentScenarioIdx < GUIDE_SCENARIOS.length - 1
    ? GUIDE_SCENARIOS[currentScenarioIdx + 1]
    : null;

  const handleStartNextScenario = () => {
    if (nextScenario) {
      startScenario(nextScenario);
      navigate(nextScenario.steps[0].page);
    }
  };

  const handleCheck = async () => {
    if (!step) return;
    setStepState('checking');
    setHintOpen(false);
    try {
      const result = await step.validate({ business, navigate });
      if (result.pass) {
        setStepState('pass', result.msg);
      } else {
        setStepState('fail', result.msg);
      }
    } catch {
      setStepState('fail', '❌ Validation error. Please try the step again.');
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      completeScenario(scenario.id);
    } else {
      nextStep();
      setHintOpen(false);
      navigate(steps[stepIdx + 1].page);
    }
  };

  const handleGoToPage = () => {
    if (step) navigate(step.page);
  };

  // ── Colour tokens based on state ──────────────────────────────────────────
  const accent = '#1a3c6e';
  const headerBg = isDone || stepState === 'pass'
    ? '#f0f9ff' // pleasant very light blue
    : stepState === 'fail'
    ? '#fff1f2' // pleasant very light rose/red
    : '#ffffff'; // clean white

  const textColor = isDone || stepState === 'pass'
    ? '#0284c7' // vibrant pleasant blue
    : stepState === 'fail'
    ? '#be123c' // soft deep red
    : '#1a3c6e'; // Aadhira brand blue

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1400,
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          bgcolor: 'rgba(26,60,110,0.15)',
          '& .MuiLinearProgress-bar': {
            background: '#2563eb',
          },
        }}
      />

      {/* ── Header strip ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: headerBg,
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          transition: 'background 0.3s',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Chip
              label={`${stepIdx + 1}/${totalSteps}`}
              size="small"
              sx={{ bgcolor: textColor, color: 'white', fontWeight: 800, fontSize: '0.7rem', height: 22 }}
            />
            <Typography
              fontWeight={800}
              fontSize={{ xs: '0.8rem', sm: '0.9rem' }}
              sx={{ color: textColor, display: 'flex', alignItems: 'center', gap: 1 }}
              noWrap
            >
              {isDone ? <BsTrophy size={14} /> : <BsBook size={14} />}
              {isDone ? `${scenario.title} — Complete!` : `${scenario.title} › ${step?.label}`}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
            <IconButton size="small" sx={{ color: textColor }}>
              {expanded ? <BsChevronDown size={15} /> : <BsChevronUp size={15} />}
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: textColor }}
              onClick={(e) => { e.stopPropagation(); stopGuide(); }}
            >
              <BsX size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* ── Expandable body ──────────────────────────────────────────────── */}
      <Collapse in={expanded}>
        <Box
          sx={{
            bgcolor: 'white',
            px: { xs: 1.5, sm: 2.5 },
            py: 2,
            maxHeight: '58vh',
            overflowY: 'auto',
            borderTop: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* ── DONE state ── */}
          {isDone && (
            <Stack sx={{ alignItems: 'center', py: 2 }} spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}><BsTrophy size={48} color="#2e7d32" /></Box>
              <Typography variant="h6" fontWeight={800} color="#1b5e20" textAlign="center">
                {nextScenario ? 'Scenario Complete!' : 'All Scenarios Mastered!'}
              </Typography>
              <Typography color="text.secondary" variant="body2" textAlign="center" sx={{ maxWidth: 420 }}>
                {nextScenario ? (
                  <>You have successfully completed <strong>{scenario.title}</strong>. Ready for the next topic?</>
                ) : (
                  <>Incredible! You have completed every guided learning scenario. Your understanding of GST compliance is complete!</>
                )}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
                {nextScenario ? (
                  <>
                    <Button variant="contained" fullWidth onClick={handleStartNextScenario} endIcon={<BsArrowRight size={15} />} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#2563eb' }}>
                      Next Module
                    </Button>
                    <Button variant="outlined" fullWidth onClick={stopGuide} sx={{ borderRadius: 2, fontWeight: 600 }}>
                      ✕ Close Module
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="contained" fullWidth onClick={() => navigate('/progress')} startIcon={<BsTrophy size={15} />} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#2e7d32' }}>
                      View My Progress
                    </Button>
                    <Button variant="outlined" fullWidth onClick={stopGuide} sx={{ borderRadius: 2, fontWeight: 600 }}>
                      ✕ Close Module
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          )}

          {/* ── Active step ── */}
          {!isDone && step && (
            <Stack spacing={1.75}>
              {/* Navigate button */}
              <Button
                size="small"
                variant="outlined"
                startIcon={<BsGeoAlt size={13} />}
                onClick={handleGoToPage}
                sx={{
                  borderRadius: 2, fontWeight: 700, fontSize: '0.78rem',
                  borderColor: accent, color: accent,
                  alignSelf: 'flex-start',
                }}
              >
                Go to: {step.pageLabel}
              </Button>

              {/* Instruction card */}
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2.5, border: `1.5px solid rgba(26,60,110,0.2)` }}>
                <Typography fontWeight={800} fontSize="0.82rem" color={accent} sx={{ mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <BsListCheck size={16} /> What to do on this step:
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                  {step.instruction}
                </Typography>
              </Box>

              {/* AI Hint toggle */}
              <Box
                sx={{
                  p: 1.5, bgcolor: 'rgba(255,243,224,0.9)', borderRadius: 2.5,
                  border: '1.5px solid rgba(237,108,2,0.25)', cursor: 'pointer',
                }}
                onClick={() => setHintOpen(h => !h)}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <BsLightbulb color="#ed6c02" size={14} />
                    <Typography fontWeight={700} fontSize="0.78rem" color="#e65100">
                      AI Explanation — tap to {hintOpen ? 'hide' : 'show'}
                    </Typography>
                  </Stack>
                  {hintOpen ? <BsChevronUp size={12} color="#e65100" /> : <BsChevronDown size={12} color="#e65100" />}
                </Stack>
                <Collapse in={hintOpen}>
                  <Divider sx={{ my: 0.75, borderColor: 'rgba(237,108,2,0.2)' }} />
                  <Typography
                    variant="caption"
                    sx={{ lineHeight: 1.85, color: '#4e342e', display: 'block', whiteSpace: 'pre-line' }}
                  >
                    {step.aiHint}
                  </Typography>
                </Collapse>
              </Box>

              {/* Validation feedback */}
              {feedback && (
                <Alert
                  severity={stepState === 'pass' ? 'success' : 'error'}
                  sx={{ borderRadius: 2.5, fontSize: '0.82rem', fontWeight: 600 }}
                  icon={stepState === 'pass' ? <BsCheckCircleFill /> : <BsXCircleFill />}
                >
                  {feedback}
                </Alert>
              )}

              {/* Action buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                {stepState !== 'pass' && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleCheck}
                    disabled={stepState === 'checking'}
                    startIcon={stepState === 'checking' ? <CircularProgress size={14} /> : <BsExclamationCircle size={14} />}
                    sx={{
                      borderRadius: 2.5, fontWeight: 700, py: 1.25,
                      borderColor: accent, color: accent,
                      '&:hover': { bgcolor: 'rgba(26,60,110,0.06)' }
                    }}
                  >
                    {stepState === 'checking' ? 'Checking...' : `✓ ${step.checkLabel}`}
                  </Button>
                )}
                {stepState === 'pass' && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCheck}
                      sx={{ borderRadius: 2.5, fontWeight: 600, borderColor: '#2e7d32', color: '#2e7d32', flexShrink: 0 }}
                    >
                      ✅ Step Passed
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleNext}
                      endIcon={<BsArrowRight />}
                      sx={{
                        borderRadius: 2.5, fontWeight: 800, py: 1.25,
                        background: isLastStep
                          ? '#2e7d32'
                          : '#2563eb',
                        fontSize: '0.95rem',
                      }}
                    >
                      {isLastStep ? 'Complete Scenario!' : 'Next Step'}
                    </Button>
                  </>
                )}
                {stepState === 'fail' && (
                  <Button
                    variant="outlined"
                    onClick={() => { setStepState('idle', null); }}
                    sx={{ borderRadius: 2.5, fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
                  >
                    Try Again
                  </Button>
                )}
              </Stack>

              {/* Step dots */}
              <Stack direction="row" spacing={0.75} sx={{ justifyContent: 'center', pt: 0.5 }}>
                {steps.map((_, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      width: idx === stepIdx ? 24 : 8,
                      height: 8, borderRadius: 4,
                      transition: 'all 0.25s',
                      bgcolor: idx < stepIdx
                        ? '#2e7d32'
                        : idx === stepIdx
                        ? accent
                        : 'rgba(0,0,0,0.12)',
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

import React, { useState } from 'react';
import {
  Box, Typography, Fab, Drawer, Stack, Button, Chip, IconButton,
  Paper, LinearProgress, useMediaQuery, useTheme, Divider
} from '@mui/material';
import {
  BsBook, BsX, BsPlayCircle, BsCheckCircleFill, BsRepeat,
  BsArrowRight, BsTrophy, BsShop, BsGlobe, BsPercent,
  BsArrowRepeat, BsClipboardCheck, BsExclamationTriangle
} from 'react-icons/bs';

const SCENARIO_ICONS = {
  intrastate: BsShop,
  interstate: BsGlobe,
  composition: BsPercent,
  itc_recon: BsArrowRepeat,
  filing: BsClipboardCheck,
  penalties: BsExclamationTriangle
};
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { useGuideStore } from '../store/useGuideStore.js';
import { GUIDE_SCENARIOS } from './guideScenarios.js';

export default function GuidedLearning() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();
  const { active, completedScenarios, startScenario, stopGuide, guideDrawerOpen: open, setGuideDrawerOpen: setOpen, tutorDrawerOpen } = useGuideStore();

  if (!isAuthenticated) return null;

  const overallPct = Math.round((completedScenarios.length / GUIDE_SCENARIOS.length) * 100);

  const handleStart = (scenario) => {
    // Stop any running guide first
    if (active) stopGuide();
    startScenario(scenario);
    navigate(scenario.steps[0].page);
    setOpen(false);
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <Fab
        title="Guided Learning Mode"
        onClick={() => setOpen(true)}
        sx={{
          display: (open || tutorDrawerOpen || active) ? 'none' : 'flex',
          position: 'fixed',
          bottom: { xs: 92, md: 108 },
          right: { xs: 16, md: 24 },
          zIndex: 1299,
          background: '#1a3c6e',
          color: 'white',
          boxShadow: '0 4px 20px rgba(26,60,110,0.3)',
          '&:hover': { transform: 'scale(1.08)', background: '#0e2444' },
          transition: 'all 0.2s',
          width: { xs: 52, md: 60 },
          height: { xs: 52, md: 60 },
        }}
      >
        <BsBook size={isMobile ? 20 : 24} />
      </Fab>

      {/* ── Scenario Picker Drawer ── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: '100%', maxWidth: 440,
              display: 'flex', flexDirection: 'column',
              bgcolor: '#fafafa',
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ background: '#1a3c6e', color: 'white', p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                <BsBook size={18} />
                <Typography fontWeight={800} fontSize="1rem">Guided Learning Mode</Typography>
              </Stack>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Step-by-step scenarios. AI validates your actions — you only advance when the step is truly complete.
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white', flexShrink: 0, mt: -0.5 }} size="small">
              <BsX size={22} />
            </IconButton>
          </Stack>

          {/* Overall progress */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9 }}>
                Overall Progress
              </Typography>
              <Typography variant="caption" fontWeight={800}>
                {completedScenarios.length} / {GUIDE_SCENARIOS.length} Scenarios
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={overallPct}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 4 },
              }}
            />
          </Box>

          {active && (
            <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2 }}>
              <Typography variant="caption" fontWeight={700}>
                🟢 Guide is active. The banner at the bottom of your screen shows your current step.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Scenario List */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
            Pick a scenario to begin:
          </Typography>

          <Stack spacing={1.5}>
            {GUIDE_SCENARIOS.map((scenario) => {
              const done = completedScenarios.includes(scenario.id);
              return (
                <Paper
                  key={scenario.id}
                  elevation={0}
                  sx={{
                    p: 2, borderRadius: 3,
                    border: done
                      ? '1.5px solid #2e7d32'
                      : '1.5px solid rgba(0,0,0,0.1)',
                    bgcolor: done ? 'rgba(46,125,50,0.04)' : 'white',
                    transition: 'all 0.15s',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.09)', transform: 'translateY(-1px)' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1.25 }}>
                    <Box sx={{ display: 'flex', mt: 0.5, color: done ? '#2e7d32' : 'primary.main', flexShrink: 0 }}>
                      {(() => {
                        const IconComponent = SCENARIO_ICONS[scenario.id] || BsBook;
                        return <IconComponent size={28} />;
                      })()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography fontWeight={700} fontSize="0.9rem">{scenario.title}</Typography>
                        {done && <BsCheckCircleFill color="#2e7d32" size={14} />}
                      </Stack>
                      <Stack direction="row" spacing={0.75} sx={{ mb: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label={scenario.difficulty} color={scenario.difficultyColor} size="small" sx={{ fontSize: '0.62rem', height: 19 }} />
                        <Chip label={`${scenario.steps.length} steps`} variant="outlined" size="small" sx={{ fontSize: '0.62rem', height: 19 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                        {scenario.description}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 1.25 }} />

                  <Button
                    variant={done ? 'outlined' : 'contained'}
                    size="small"
                    fullWidth
                    onClick={() => handleStart(scenario)}
                    startIcon={done ? <BsRepeat size={12} /> : <BsPlayCircle size={12} />}
                    endIcon={<BsArrowRight size={12} />}
                    sx={{
                      borderRadius: 2, fontWeight: 700, py: 0.9,
                      ...(done
                        ? { borderColor: '#2e7d32', color: '#2e7d32' }
                        : { background: '#2563eb', color: 'white' }
                      ),
                    }}
                  >
                    {done ? 'Practice Again' : 'Start Guided Scenario'}
                  </Button>
                </Paper>
              );
            })}
          </Stack>

          {completedScenarios.length === GUIDE_SCENARIOS.length && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(46,125,50,0.08)', borderRadius: 3, border: '1.5px solid rgba(46,125,50,0.3)', textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                <BsTrophy size={40} color="#2e7d32" />
              </Box>
              <Typography fontWeight={800} color="#1b5e20" gutterBottom>All Scenarios Complete!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                You have completed every guided GST scenario. You are ready for real-world GST compliance!
              </Typography>
              <Button
                variant="contained"
                startIcon={<BsTrophy />}
                onClick={() => { navigate('/progress'); setOpen(false); }}
                sx={{ bgcolor: '#2e7d32', borderRadius: 2, fontWeight: 700 }}
              >
                View My Achievements
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

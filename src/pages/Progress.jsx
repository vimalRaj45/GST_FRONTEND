import React, { useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Alert,
  LinearProgress, Button, Divider, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  BsTrophy, BsCheckCircleFill, BsCircle, BsStars, BsBuilding,
  BsReceipt, BsWallet2, BsCalendarCheck, BsCalculator, BsPatchQuestion,
  BsFileEarmarkText, BsTruck, BsCardList, BsArrowRight, BsBarChart, BsBook, BsExclamationCircle
} from 'react-icons/bs';
import useProgressStore from '../store/useProgressStore.js';
import { useAppStore } from '../store/useAppStore.js';

const MODULES = [
  { key: 'usedCalculator', label: 'Use GST Calculator', desc: 'Calculate CGST, SGST & IGST', icon: BsCalculator, path: '/calculator', color: '#0288d1' },
  { key: 'createdInvoice', label: 'Create a Tax Invoice', desc: 'Issue your first B2B or B2C invoice', icon: BsReceipt, path: '/invoices/new', color: '#e07b00' },
  { key: 'viewedLedger', label: 'View ITC Ledger', desc: 'Understand input tax credit tracking', icon: BsWallet2, path: '/ledger', color: '#2e7d32' },
  { key: 'closedPeriod', label: 'Close a Tax Period', desc: 'Generate your GSTR-1 return', icon: BsCalendarCheck, path: '/periods', color: '#6a1b9a' },
  { key: 'viewedGstr1', label: 'View GSTR-1', desc: 'Analyse your outward supply return', icon: BsFileEarmarkText, path: '/periods', color: '#0277bd' },
  { key: 'filedReturn', label: 'File GSTR-3B', desc: 'Pay net tax and unlock buyer ITC', icon: BsCheckCircleFill, path: '/periods', color: '#2e7d32' },
  { key: 'completedQuiz', label: 'Complete a Quiz', desc: 'Test your GST knowledge', icon: BsPatchQuestion, path: '/quiz', color: '#c62828' },
  { key: 'exploredHsn', label: 'Explore HSN Codes', desc: 'Learn product classification codes', icon: BsCardList, path: '/hsn-explorer', color: '#37474f' },
  { key: 'generatedEWayBill', label: 'Generated E-Way Bill', desc: 'Simulate goods movement documentation', icon: BsTruck, path: '/ewaybill', color: '#00796b' },
];

const QUIZ_TOPICS = [
  'Input Tax Credit (ITC) rules and eligibility',
  'CGST vs SGST vs IGST — when each applies',
  'Invoice types and when to use them',
  'Monthly returns: GSTR-1 and GSTR-3B',
  'Late filing penalties and interest',
  'Composition scheme rules and restrictions',
  'Export and zero-rated supplies',
  'Reverse Charge Mechanism (RCM)',
  'HSN codes and tax rate classification',
  'ITC matching and invoice reconciliation',
];

const BADGES = [
  { id: 'first_step', label: 'First Step', desc: 'Active business scenario selected', icon: BsBuilding, req: (m, acc, hasBiz) => hasBiz },
  { id: 'invoice_master', label: 'Invoice Master', desc: 'Created your first tax invoice', icon: BsReceipt, req: (m) => m.createdInvoice },
  { id: 'gst_filer', label: 'GST Filer', desc: 'Successfully filed GSTR-3B', icon: BsCalendarCheck, req: (m) => m.filedReturn },
  { id: 'quiz_whiz', label: 'Quiz Whiz', desc: 'Completed a quiz with 80%+ accuracy', icon: BsTrophy, req: (_, acc) => acc >= 80 },
  { id: 'hsn_expert', label: 'HSN Expert', desc: 'Explored the HSN code library', icon: BsCardList, req: (m) => m.exploredHsn },
  { id: 'logistics_pro', label: 'Logistics Pro', desc: 'Generated an E-Way Bill', icon: BsTruck, req: (m) => m.generatedEWayBill },
  { id: 'gst_master', label: 'GST Master', desc: 'Completed all simulated learning modules', icon: BsStars, req: (m) => MODULES.every((mod) => m[mod.key]) },
];

function ModuleCard({ module, done }) {
  const navigate = useNavigate();
  const Icon = module.icon;
  return (
    <Card
      variant="outlined"
      sx={{
        border: done ? `2px solid ${module.color}50` : '1.5px solid',
        borderColor: done ? `${module.color}50` : 'divider',
        bgcolor: done ? `${module.color}07` : 'background.paper',
        transition: 'all 0.2s',
        cursor: done ? 'default' : 'pointer',
        '&:hover': done ? {} : { borderColor: module.color, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${module.color}20` },
      }}
      onClick={() => !done && navigate(module.path)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{
            p: 1, borderRadius: 1.5, bgcolor: done ? `${module.color}15` : '#f5f5f5',
            flexShrink: 0, display: 'flex',
          }}>
            <Icon size={20} color={done ? module.color : '#999'} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography fontWeight={700} fontSize="0.875rem" sx={{ color: done ? module.color : 'text.primary' }}>
                {module.label}
              </Typography>
              {done
                ? <BsCheckCircleFill size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
                : <BsCircle size={16} color="#ccc" style={{ flexShrink: 0 }} />
              }
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
              {module.desc}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Progress() {
  const navigate = useNavigate();
  const { business } = useAppStore();
  const { modules, quizAttempts, getTopicStats, getOverallAccuracy, getModuleProgress, resetProgress } = useProgressStore();

  const moduleProgress = getModuleProgress();
  const overallAccuracy = getOverallAccuracy();
  const topicStats = getTopicStats();
  const doneBadges = BADGES.filter((b) => b.req(modules, overallAccuracy, !!business));

  const totalQuestions = quizAttempts.reduce((s, a) => s + a.total, 0);
  const totalCorrect = quizAttempts.reduce((s, a) => s + a.correct, 0);

  // What to learn next
  const nextModule = MODULES.find((m) => !modules[m.key]);
  const weakTopic = Object.entries(topicStats)
    .filter(([, s]) => s.total >= 2 && s.correct / s.total < 0.6)
    .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))[0];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
        <BsTrophy size={26} color="#e07b00" />
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.8rem' } }}>
            Learning Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {business ? `${business.name} ·` : ''} Track your GST mastery
          </Typography>
        </Box>
      </Stack>

      {/* Hero Stats */}
      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: '#1a3c6e', color: 'white', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>Overall Progress</Typography>
              <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: '2.5rem', md: '3rem' }, my: 1 }}>{moduleProgress}%</Typography>
              <LinearProgress
                variant="determinate" value={moduleProgress}
                sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#60a5fa' } }}
              />
              <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
                {MODULES.filter((m) => modules[m.key]).length}/{MODULES.length} modules completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card sx={{ height: '100%', bgcolor: overallAccuracy >= 80 ? '#e8f5e9' : overallAccuracy >= 50 ? '#fff8e1' : '#fafafa' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <BsBarChart size={28} color={overallAccuracy >= 80 ? '#2e7d32' : '#e07b00'} />
              <Typography variant="h3" fontWeight={900} sx={{ color: overallAccuracy >= 80 ? '#2e7d32' : '#e07b00', fontSize: { xs: '2rem', md: '2.5rem' }, my: 0.5 }}>
                {overallAccuracy}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Quiz Accuracy</Typography>
              <Typography variant="body2" fontWeight={600} color="text.secondary" display="block">
                {totalCorrect}/{totalQuestions} correct
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <BsTrophy size={28} color="#e07b00" />
              <Typography variant="h3" fontWeight={900} sx={{ color: '#e07b00', fontSize: { xs: '2rem', md: '2.5rem' }, my: 0.5 }}>
                {doneBadges.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Badges Earned</Typography>
              <Typography variant="body2" fontWeight={600} color="text.secondary" display="block">
                of {BADGES.length} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* What to Learn Next */}
      {(nextModule || weakTopic) && (
        <Card sx={{ mb: 3, border: '2px solid #1a3c6e30', bgcolor: '#f0f4ff' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
              <BsStars size={18} color="#e07b00" />
              <Typography fontWeight={700} color="#1a3c6e">What to Learn Next</Typography>
            </Stack>
            <Stack spacing={1.5}>
              {nextModule && (
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }} spacing={1}>
                  <Box>
                    <Typography fontWeight={600} fontSize="0.9rem" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BsBook size={16} /> Next Module: {nextModule.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{nextModule.desc}</Typography>
                  </Box>
                  <Button size="small" variant="contained" endIcon={<BsArrowRight size={13} />}
                    onClick={() => navigate(nextModule.path)} sx={{ flexShrink: 0 }}>
                    Start
                  </Button>
                </Stack>
              )}
              {weakTopic && (
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }} spacing={1}>
                  <Box>
                    <Typography fontWeight={600} fontSize="0.9rem" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BsExclamationCircle size={16} /> Needs Practice: {weakTopic[0].split('—')[0].trim()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      You scored {weakTopic[1].correct}/{weakTopic[1].total} — try more questions on this topic
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" endIcon={<BsArrowRight size={13} />}
                    onClick={() => navigate('/quiz')} sx={{ flexShrink: 0 }}>
                    Practice
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Learning Modules */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Learning Modules</Typography>
          <Grid container spacing={1.5}>
            {MODULES.map((mod) => (
              <Grid size={{ xs: 12, sm: 6 }} key={mod.key}>
                <ModuleCard module={mod} done={modules[mod.key]} />
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Badges + Quiz Stats */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Badges */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Achievement Badges</Typography>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Grid container spacing={1.5}>
                {BADGES.map((badge) => {
                  const earned = badge.req(modules, overallAccuracy, !!business);
                  return (
                    <Grid size={{ xs: 6 }} key={badge.id}>
                      <Box sx={{
                        p: 2, borderRadius: 2, textAlign: 'center',
                        border: '1.5px solid', borderColor: earned ? '#e07b0050' : 'divider',
                        bgcolor: earned ? '#fff8e1' : '#fafafa',
                        opacity: earned ? 1 : 0.45,
                        transition: 'all 0.2s',
                      }}>
                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                          {(() => {
                            const IconComponent = badge.icon;
                            return <IconComponent size={28} color={earned ? '#e07b00' : '#999'} />;
                          })()}
                        </Box>
                        <Typography fontWeight={700} fontSize="0.75rem" sx={{ color: earned ? '#e07b00' : 'text.secondary' }}>{badge.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3, fontSize: '0.65rem' }}>{badge.desc}</Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>

          {/* Quiz Stats per Topic */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quiz Stats by Topic</Typography>
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              {Object.keys(topicStats).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <BsPatchQuestion size={32} color="#ccc" />
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>No quiz attempts yet.</Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate('/quiz')}>
                    Take a Quiz
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {QUIZ_TOPICS.map((topic) => {
                    const stat = topicStats[topic];
                    if (!stat) return null;
                    const accuracy = Math.round((stat.correct / stat.total) * 100);
                    const color = accuracy >= 80 ? '#2e7d32' : accuracy >= 50 ? '#e07b00' : '#c62828';
                    return (
                      <Box key={topic}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600} sx={{ maxWidth: '75%' }}>{topic.split('—')[0].trim()}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color }}>{accuracy}%</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate" value={accuracy}
                          sx={{ height: 6, borderRadius: 3, bgcolor: `${color}20`, '& .MuiLinearProgress-bar': { bgcolor: color } }}
                        />
                        <Typography variant="caption" color="text.secondary">{stat.correct}/{stat.total} correct</Typography>
                      </Box>
                    );
                  }).filter(Boolean)}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Button
            size="small" color="error" variant="outlined"
            sx={{ mt: 2, fontSize: '0.75rem' }}
            onClick={() => {
              Swal.fire({
                title: 'Reset all progress?',
                text: 'This will reset your learning modules and quiz statistics!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#1a3c6e',
                confirmButtonText: 'Yes, reset it!'
              }).then((result) => {
                if (result.isConfirmed) {
                  resetProgress();
                  Swal.fire('Reset!', 'Your progress has been reset.', 'success');
                }
              });
            }}
          >
            Reset Progress
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

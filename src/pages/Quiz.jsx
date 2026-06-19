import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Button, MenuItem, TextField,
  Alert, CircularProgress, Divider, Chip, LinearProgress, Skeleton
} from '@mui/material';
import {
  BsStars, BsCheckCircleFill, BsXCircleFill, BsPatchQuestion, BsArrowRight
} from 'react-icons/bs';
import { generateQuizQuestion, saveQuizAttempt } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';

const TOPICS = [
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

export default function Quiz() {
  const { sessionId } = useAppStore();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const fetchQuestion = async () => {
    setLoading(true); setError(null); setQuestion(null); setSelected(null); setSubmitted(false);
    try { const q = await generateQuizQuestion(topic); setQuestion(q); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitted(true);
    const isCorrect = Number(selected) === question.correctIndex;
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    try {
      await saveQuizAttempt({ session_id: sessionId, topic, question_payload_json: question, selected_answer: Number(selected), is_correct: isCorrect, ai_explanation: question.explanation });
    } catch (_) {}
  };

  const isCorrect = submitted && Number(selected) === question?.correctIndex;

  return (
    <Box maxWidth={740} mx="auto">
      <ExplainerCallout title="AI-Generated GST Quiz">
        Each question is crafted by Mistral AI using realistic Indian business scenarios.
        After answering, you get the correct answer + a detailed explanation to reinforce your learning.
      </ExplainerCallout>

      {/* Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <BsPatchQuestion size={22} color="#1a3c6e" />
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.3rem', md: '1.75rem' } }}>GST Quiz</Typography>
        </Stack>
        {score.total > 0 && (
          <Chip
            label={`Score: ${score.correct}/${score.total}`}
            color={score.correct === score.total ? 'success' : 'primary'}
            size="medium" fontWeight={700}
          />
        )}
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Quiz Topic" value={topic} onChange={(e) => setTopic(e.target.value)} fullWidth size="small">
              {TOPICS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <Button
              variant="contained" startIcon={<BsStars size={16} />} onClick={fetchQuestion}
              disabled={loading} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
            <Skeleton variant="text" height={32} width="85%" sx={{ mb: 2 }} />
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1.5, borderRadius: 2 }} />)}
            <Typography variant="caption" color="text.secondary">Asking Mistral AI to craft a scenario-based question...</Typography>
          </CardContent>
        </Card>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {question && !loading && (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
              <Chip label={question.topic || topic} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem', maxWidth: '90%' }} />
              <Chip label="AI Generated" size="small" icon={<BsStars size={11} />} sx={{ fontSize: '0.7rem' }} />
            </Stack>

            <Typography variant="h6" fontWeight={700} sx={{ mb: 3, lineHeight: 1.55, fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              {question.question}
            </Typography>

            <Stack spacing={1.5}>
              {question.options.map((opt, idx) => {
                let bgcolor = 'background.paper';
                let borderColor = 'divider';
                let border = '1.5px solid';

                if (submitted) {
                  if (idx === question.correctIndex)              { bgcolor = '#e8f5e9'; borderColor = '#2e7d32'; border = '2px solid'; }
                  else if (idx === Number(selected) && !isCorrect){ bgcolor = '#ffebee'; borderColor = '#c62828'; border = '2px solid'; }
                } else if (selected === String(idx)) {
                  bgcolor = '#e3f2fd'; borderColor = 'primary.main'; border = '2px solid';
                }

                return (
                  <Box
                    key={idx}
                    onClick={() => !submitted && setSelected(String(idx))}
                    sx={{
                      p: { xs: 1.5, md: 2 }, borderRadius: 2, border, borderColor, bgcolor,
                      cursor: submitted ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      '&:hover': !submitted ? { borderColor: 'primary.main', bgcolor: '#f0f4ff' } : {},
                    }}
                  >
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: selected === String(idx) ? 'primary.main' : '#eee',
                      color: selected === String(idx) ? 'white' : '#666',
                      fontWeight: 700, fontSize: '0.8rem',
                    }}>
                      {['A','B','C','D'][idx]}
                    </Box>
                    <Typography fontSize={{ xs: '0.875rem', md: '0.95rem' }} sx={{ flex: 1 }}>{opt}</Typography>
                    {submitted && idx === question.correctIndex && <BsCheckCircleFill size={20} color="#2e7d32" style={{ flexShrink: 0 }} />}
                    {submitted && idx === Number(selected) && !isCorrect && idx !== question.correctIndex && <BsXCircleFill size={20} color="#c62828" style={{ flexShrink: 0 }} />}
                  </Box>
                );
              })}
            </Stack>

            {!submitted && (
              <Button variant="contained" size="large" fullWidth
                disabled={selected === null} onClick={handleSubmit}
                sx={{ mt: 3, py: 1.2, borderRadius: 2 }}>
                Submit Answer
              </Button>
            )}

            {submitted && (
              <Box sx={{ mt: 3 }}>
                <Alert severity={isCorrect ? 'success' : 'error'} icon={isCorrect ? <BsCheckCircleFill /> : <BsXCircleFill />} sx={{ mb: 2, fontWeight: 700 }}>
                  {isCorrect ? 'Correct! Well done.' : 'Incorrect. See the explanation below.'}
                </Alert>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BsStars color="#e07b00" /> Explanation
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.85, color: 'text.secondary' }}>{question.explanation}</Typography>
                <Button variant="outlined" size="large" sx={{ mt: 3 }} fullWidth
                  endIcon={<BsArrowRight />} onClick={fetchQuestion}>
                  Next Question
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

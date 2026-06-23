import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Button, Chip,
  Radio, Checkbox, FormControlLabel, FormGroup, RadioGroup, TextField,
  Alert, Divider, CircularProgress, Paper, IconButton
} from '@mui/material';
import {
  BsCheckCircleFill, BsXCircleFill, BsPatchQuestion, BsArrowLeft, BsStars, BsAward
} from 'react-icons/bs';
import { getStudentQuizzes, getStudentQuizDetails, submitStudentQuiz } from '../api/client.js';
import toast from 'react-hot-toast';
import { usePolling } from '../hooks/usePolling.js';

export default function InstituteQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeQuizLoading, setActiveQuizLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentQuizzes();
      setQuizzes(data);
    } catch (err) {
      toast.error('Failed to load quizzes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only poll quiz list when NOT inside an active quiz to avoid interrupting the user
  usePolling(fetchQuizzes, 30000, !activeQuiz);

  const handleStartQuiz = async (quizId) => {
    setActiveQuizLoading(true);
    setResults(null);
    try {
      const quizDetails = await getStudentQuizDetails(quizId);
      setActiveQuiz(quizDetails);
      // Initialize answers array
      const initialAnswers = quizDetails.questions.map(q => {
        if (q.question_type === 'multiple_select') return [];
        if (q.question_type === 'fill_in_the_blanks') return '';
        return null; // MCQ
      });
      setAnswers(initialAnswers);
    } catch (err) {
      toast.error('Failed to load quiz details: ' + err.message);
    } finally {
      setActiveQuizLoading(false);
    }
  };

  const handleAnswerChange = (qIdx, type, val) => {
    setAnswers(prev => {
      const copy = [...prev];
      if (type === 'multiple_select') {
        const current = copy[qIdx] || [];
        if (current.includes(val)) {
          copy[qIdx] = current.filter(v => v !== val);
        } else {
          copy[qIdx] = [...current, val];
        }
      } else {
        copy[qIdx] = val;
      }
      return copy;
    });
  };

  const handleSubmitQuiz = async () => {
    // Check if student has answered all questions
    for (let i = 0; i < activeQuiz.questions.length; i++) {
      const q = activeQuiz.questions[i];
      const ans = answers[i];
      if (q.question_type === 'mcq' && ans === null) {
        toast.error(`Please answer Question #${i + 1}`);
        return;
      }
      if (q.question_type === 'multiple_select' && (!ans || ans.length === 0)) {
        toast.error(`Please select at least one option for Question #${i + 1}`);
        return;
      }
      if (q.question_type === 'fill_in_the_blanks' && !String(ans || '').trim()) {
        toast.error(`Please fill in the blank for Question #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await submitStudentQuiz(activeQuiz.id, answers);
      setResults(res);
      toast.success(`Quiz completed! You scored ${res.score}/${res.total}`);
      fetchQuizzes(); // Refresh quiz list scores
    } catch (err) {
      toast.error('Failed to submit quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToList = () => {
    setActiveQuiz(null);
    setResults(null);
    setAnswers([]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Quiz list view
  if (!activeQuiz) {
    return (
      <Box maxWidth={800} mx="auto" sx={{ px: { xs: 2, md: 0 }, py: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <BsPatchQuestion size={32} color="#1a3c6e" />
          <Typography variant="h4" fontWeight={800} color="primary.main">
            Institute Quizzes
          </Typography>
        </Stack>

        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            These quizzes are assigned by your training institute. Complete them to test your GST knowledge!
          </Alert>
        </Box>

        <Stack spacing={2}>
          {quizzes.map((q) => {
            const isCompleted = q.completed_at !== null;
            const percentage = isCompleted ? Math.round((q.score / q.total_questions) * 100) : 0;
            return (
              <Card key={q.id} sx={{ border: '1px solid rgba(26,60,110,0.1)', '&:hover': { borderColor: 'primary.main', transition: 'all 0.2s' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                        {q.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {q.description || 'No description provided.'}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label={`${q.question_count} Questions`} size="small" variant="outlined" />
                        {isCompleted && (
                          <Chip 
                            label={`Score: ${q.score}/${q.total_questions} (${percentage}%)`} 
                            color={percentage >= 50 ? 'success' : 'error'}
                            size="small"
                          />
                        )}
                      </Stack>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                      <Button
                        variant={isCompleted ? 'outlined' : 'contained'}
                        color={isCompleted ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={() => handleStartQuiz(q.id)}
                        disabled={activeQuizLoading}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        {isCompleted ? 'Retake Quiz' : 'Take Quiz'}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

          {quizzes.length === 0 && (
            <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed rgba(0,0,0,0.12)', borderRadius: 3 }}>
              <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                No quizzes assigned by your institute yet.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Box>
    );
  }

  if (activeQuizLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Quiz Taking/Submit results view
  return (
    <Box maxWidth={800} mx="auto" sx={{ px: { xs: 2, md: 0 }, py: 3 }}>
      <Button 
        startIcon={<BsArrowLeft />} 
        onClick={handleBackToList}
        sx={{ mb: 3, fontWeight: 700 }}
      >
        Back to Quizzes
      </Button>

      {/* Title block */}
      <Card sx={{ mb: 3, border: '1px solid rgba(26,60,110,0.12)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>
            {activeQuiz.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeQuiz.description || 'No description provided.'}
          </Typography>
        </CardContent>
      </Card>

      {/* Quiz Submission Results Scoreboard */}
      {results && (
        <Card sx={{ mb: 4, bgcolor: '#f1f8e9', border: '2px solid #2e7d32', borderRadius: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <BsAward size={48} color="#2e7d32" style={{ marginBottom: 8 }} />
            <Typography variant="h5" fontWeight={800} color="success.main" gutterBottom>
              Quiz Completed!
            </Typography>
            <Typography variant="h3" fontWeight={800} color="primary.main" gutterBottom>
              {results.score} / {results.total}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Score percentage: {Math.round((results.score / results.total) * 100)}%
            </Typography>
            <Button variant="contained" color="success" onClick={handleBackToList} sx={{ fontWeight: 700, borderRadius: 2 }}>
              Done & Return
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      <Stack spacing={3}>
        {(results ? results.questions : activeQuiz.questions).map((q, idx) => {
          const studentAns = results ? q.student_answer : answers[idx];
          const isQCorrect = results ? q.is_correct : null;
          
          return (
            <Card 
              key={q.id} 
              sx={{ 
                border: '1px solid', 
                borderColor: results ? (isQCorrect ? '#2e7d32' : '#c62828') : 'divider',
                borderRadius: 3,
                bgcolor: results ? (isQCorrect ? 'rgba(46,125,50,0.02)' : 'rgba(198,40,40,0.02)') : 'background.paper'
              }}
            >
              {/* Question toolbar/header */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  px: 3, 
                  py: 1.5, 
                  bgcolor: 'rgba(0,0,0,0.01)', 
                  borderBottom: '1px solid rgba(0,0,0,0.05)' 
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                  Question {idx + 1}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={q.question_type.replace(/_/g, ' ').toUpperCase()} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontSize: '0.65rem', height: 20 }} 
                  />
                  {results && (
                    <Chip 
                      label={isQCorrect ? 'Correct' : 'Incorrect'} 
                      color={isQCorrect ? 'success' : 'error'}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}
                </Stack>
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="body1" fontWeight={700} sx={{ mb: 3, lineHeight: 1.6 }}>
                  {q.question_text}
                </Typography>

                {/* Multiple choice (MCQ) option cards */}
                {q.question_type === 'mcq' && q.options && (
                  <Stack spacing={1.5}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = studentAns === optIdx;
                      let optionBg = 'background.paper';
                      let optionBorder = '1px solid rgba(0,0,0,0.08)';

                      if (results) {
                        const correctAns = Number(q.correct_answers[0]);
                        if (optIdx === correctAns) {
                          optionBg = '#e8f5e9';
                          optionBorder = '2px solid #2e7d32';
                        } else if (isSelected && !isQCorrect) {
                          optionBg = '#ffebee';
                          optionBorder = '2px solid #c62828';
                        }
                      } else if (isSelected) {
                        optionBg = '#e3f2fd';
                        optionBorder = '2px solid #1a3c6e';
                      }

                      return (
                        <Box
                          key={optIdx}
                          onClick={() => !results && handleAnswerChange(idx, 'mcq', optIdx)}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: optionBorder,
                            bgcolor: optionBg,
                            cursor: results ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'all 0.15s',
                            '&:hover': !results ? { borderColor: 'primary.main', bgcolor: '#f0f4ff' } : {}
                          }}
                        >
                          <Radio 
                            checked={isSelected}
                            disabled={!!results}
                            sx={{ p: 0 }}
                          />
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                            {opt}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Multiple Select checkbox options */}
                {q.question_type === 'multiple_select' && q.options && (
                  <Stack spacing={1.5}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = Array.isArray(studentAns) && studentAns.includes(optIdx);
                      let optionBg = 'background.paper';
                      let optionBorder = '1px solid rgba(0,0,0,0.08)';

                      if (results) {
                        const correctIndices = q.correct_answers.map(Number);
                        const isCorrectOpt = correctIndices.includes(optIdx);
                        if (isCorrectOpt) {
                          optionBg = '#e8f5e9';
                          optionBorder = '2px solid #2e7d32';
                        } else if (isSelected && !isCorrectOpt) {
                          optionBg = '#ffebee';
                          optionBorder = '2px solid #c62828';
                        }
                      } else if (isSelected) {
                        optionBg = '#e3f2fd';
                        optionBorder = '2px solid #1a3c6e';
                      }

                      return (
                        <Box
                          key={optIdx}
                          onClick={() => !results && handleAnswerChange(idx, 'multiple_select', optIdx)}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: optionBorder,
                            bgcolor: optionBg,
                            cursor: results ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'all 0.15s',
                            '&:hover': !results ? { borderColor: 'primary.main', bgcolor: '#f0f4ff' } : {}
                          }}
                        >
                          <Checkbox 
                            checked={isSelected}
                            disabled={!!results}
                            sx={{ p: 0 }}
                          />
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                            {opt}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Fill in the blanks text input */}
                {q.question_type === 'fill_in_the_blanks' && (
                  <Box>
                    <TextField 
                      label="Your Answer" 
                      fullWidth
                      disabled={!!results}
                      value={studentAns || ''}
                      onChange={e => handleAnswerChange(idx, 'fill_in_the_blanks', e.target.value)}
                      placeholder="Type your answer here..."
                    />
                    {results && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Acceptable Answer(s): <span style={{ color: '#2e7d32' }}>{q.correct_answers.join(' OR ')}</span>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Results explanation */}
                {results && q.explanation && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BsStars color="#ed6c02" /> Explanation
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {q.explanation}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          );
        })}
      </Stack>

      {!results && (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            fullWidth
            onClick={handleSubmitQuiz}
            disabled={submitting}
            sx={{ py: 1.5, fontWeight: 700, borderRadius: 2.5 }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Answers'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

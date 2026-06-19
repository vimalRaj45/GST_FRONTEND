import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Fab, Drawer, TextField, IconButton, Stack, Avatar,
  Paper, CircularProgress, Divider, Chip, useMediaQuery, useTheme
} from '@mui/material';
import {
  BsSend, BsX, BsMortarboard, BsRobot, BsPerson, BsLightbulb
} from 'react-icons/bs';
import { tutorChat } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';

const LOGO_URL = '/logo.png';

const WELCOME = `Hello! I'm your **GST Tutor** by Aadhira Solutions.

I can help you understand:
- How GST works in your simulated business
- Why your ITC entries have specific statuses
- Difference between GSTR-1 and GSTR-3B
- What happens when you close or file a period

Ask me anything about GST!`;

const QUICK_PROMPTS = [
  'What is ITC?',
  'How does IGST work?',
  'What is GSTR-3B?',
  'Explain composition scheme',
];

export default function TutorWidget() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { sessionId, business } = useAppStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ role: 'assistant', content: WELCOME }]);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const context = business
        ? { businessName: business.name, gstin: business.gstin, state: business.state, scheme: business.scheme_type }
        : {};
      const res = await tutorChat({ sessionId, message: userMsg.content, messages: newMessages.slice(-10), contextSummary: context });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatContent = (content) =>
    content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  const drawerWidth = isMobile ? '100%' : 420;

  return (
    <>
      {/* Floating Button */}
      <Fab
        sx={{
          display: open ? 'none' : 'flex',
          position: 'fixed', bottom: { xs: 16, md: 24 }, right: { xs: 16, md: 24 }, zIndex: 1300,
          background: 'linear-gradient(135deg,#1a3c6e,#2d5fa0)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(26,60,110,0.4)',
          '&:hover': { transform: 'scale(1.08)', background: 'linear-gradient(135deg,#2d5fa0,#1a3c6e)' },
          transition: 'all 0.2s',
          width: { xs: 52, md: 60 },
          height: { xs: 52, md: 60 },
        }}
        onClick={() => setOpen(true)}
        title="Open GST Tutor"
      >
        <BsMortarboard size={isMobile ? 22 : 26} />
      </Fab>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 420,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg,#1a3c6e,#2d5fa0)', color: 'white', p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1, pr: 1 }}>
              <Box
                component="img" src={LOGO_URL} alt="Aadhira"
                sx={{ height: 36, width: 36, borderRadius: 1.5, objectFit: 'contain', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} fontSize="0.95rem" noWrap>GST Tutor</Typography>
                <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.65rem', display: 'block', lineHeight: 1.2 }}>
                  Aadhira Solutions · Powered by Mistral AI
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white', flexShrink: 0 }} size="small">
              <BsX size={22} />
            </IconButton>
          </Stack>
          {business && (
            <Chip
              label={business.name} size="small"
              sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.7rem', fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f7fb' }}>
          <Stack spacing={1.75}>
            {messages.map((msg, idx) => (
              <Stack
                key={idx} direction="row" spacing={1}
                justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'} alignItems="flex-end"
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: '#1a3c6e', width: 30, height: 30, flexShrink: 0 }}>
                    <BsRobot size={16} color="white" />
                  </Avatar>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5, maxWidth: '85%', wordBreak: 'break-word',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    bgcolor: msg.role === 'user' ? '#1a3c6e' : 'white',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography
                    variant="body2" sx={{ lineHeight: 1.65, fontSize: '0.85rem' }}
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                </Paper>
                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: '#e07b00', width: 30, height: 30, flexShrink: 0 }}>
                    <BsPerson size={16} color="white" />
                  </Avatar>
                )}
              </Stack>
            ))}

            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ bgcolor: '#1a3c6e', width: 30, height: 30 }}>
                  <BsRobot size={16} color="white" />
                </Avatar>
                <Paper elevation={1} sx={{ p: 1.5, borderRadius: '16px 16px 16px 4px' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={14} thickness={5} />
                    <Typography variant="caption" color="text.secondary">Thinking...</Typography>
                  </Stack>
                </Paper>
              </Stack>
            )}
            <div ref={bottomRef} />
          </Stack>
        </Box>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <Box sx={{ px: 2, pb: 1, bgcolor: '#f5f7fb' }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
              <BsLightbulb size={13} color="#e07b00" />
              <Typography variant="caption" color="text.secondary">Quick questions</Typography>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {QUICK_PROMPTS.map((q) => (
                <Chip key={q} label={q} size="small" clickable variant="outlined"
                  onClick={() => setInput(q)}
                  sx={{ cursor: 'pointer', fontSize: '0.7rem', '&:hover': { bgcolor: '#e3f2fd' } }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Input */}
        <Box sx={{ p: 1.5, bgcolor: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth multiline maxRows={3} size="small"
              placeholder="Ask about GST, ITC, invoices..."
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              onClick={sendMessage} disabled={!input.trim() || loading}
              sx={{
                bgcolor: '#1a3c6e', color: 'white', width: 40, height: 40, borderRadius: 2,
                '&:hover': { bgcolor: '#2d5fa0' },
                '&:disabled': { bgcolor: '#e0e0e0' },
                flexShrink: 0,
              }}
            >
              <BsSend size={16} />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
            Enter to send · Shift+Enter for new line
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}

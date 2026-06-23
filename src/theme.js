import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a3c6e',      // Aadhira Solutions logo blue
      light: '#3660a1',
      dark: '#0e2444',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb',      // Professional accent blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    success: { main: '#15803d', light: '#4ade80', dark: '#166534' },
    warning: { main: '#b45309', light: '#f59e0b', dark: '#78350f' },
    error: { main: '#b91c1c', light: '#f87171', dark: '#7f1d1d' },
    info: { main: '#1d4ed8', light: '#60a5fa', dark: '#1e3a8a' },
    background: {
      default: '#f8fafc', // Very light, clean slate
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: 'rgba(148, 163, 184, 0.2)',
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.875rem' },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '0.95rem' },
  },
  shape: { borderRadius: 8 }, // Cleaner, sharper corners for desktop
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: '#1a3c6e',
          boxShadow: '0 4px 12px rgba(26,60,110,0.15)',
          '&:hover': {
            background: '#0e2444',
            boxShadow: '0 6px 16px rgba(26,60,110,0.25)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: '#2563eb',
          boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
          '&:hover': {
            background: '#1d4ed8',
            boxShadow: '0 6px 16px rgba(37,99,235,0.25)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': { borderWidth: '2px' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 10px 40px rgba(15,23,42,0.06)',
          border: '1px solid rgba(148,163,184,0.15)',
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', borderRadius: 8 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f1f5f9',
            color: '#334155',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: '2px solid rgba(148,163,184,0.2)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '14px 16px', borderBottom: '1px solid rgba(148,163,184,0.1)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s',
            '&:hover fieldset': { borderColor: '#94a3b8' },
            '&.Mui-focused fieldset': { borderWidth: '2px' },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 500, border: '1px solid', '& .MuiAlert-icon': { alignItems: 'center' } },
        standardSuccess: { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' },
        standardInfo:    { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' },
        standardWarning: { backgroundColor: '#fffbeb', color: '#92400e', borderColor: '#fde68a' },
        standardError:   { backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' },
      },
    },
  },
});

export default theme;

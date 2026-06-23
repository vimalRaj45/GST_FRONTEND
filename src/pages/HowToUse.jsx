import React from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stepper, Step, StepLabel,
  StepContent, Button, Stack, useMediaQuery, useTheme, Divider
} from '@mui/material';
import {
  BsBuilding, BsReceiptCutoff, BsWallet2, BsCalendarCheck,
  BsLightbulbFill, BsShieldCheck, BsRobot
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import ExplainerCallout from '../components/ExplainerCallout.jsx';

const guideSteps = [
  {
    label: '1. Register a Simulated Business',
    icon: <BsBuilding size={24} color="#1a3c6e" />,
    description: `Start by registering your fictional business. You'll choose a name, a state (crucial for CGST/SGST vs IGST calculation), and a GST scheme (Regular or Composition). The system will instantly generate a simulated 15-digit GSTIN for you.`,
    action: 'Register Now',
    path: '/register',
    tips: [
      'Regular Scheme: Standard tax rates (5%, 12%, 18%, 28%), but you can claim Input Tax Credit (ITC).',
      'Composition Scheme: Low flat rate (1%), but no ITC allowed and cannot issue Tax Invoices.',
    ],
  },
  {
    label: '2. Create Invoices',
    icon: <BsReceiptCutoff size={24} color="#e07b00" />,
    description: `Act as a seller and create invoices for your customers. You can sell to B2C (unregistered) or B2B (other registered businesses in the simulator).`,
    action: 'New Invoice',
    path: '/invoices/sell',
    tips: [
      'If buyer & seller are in the SAME state → CGST + SGST applied.',
      'If buyer & seller are in DIFFERENT states → IGST applied.',
      'B2B invoices instantly push ITC (Input Tax Credit) to the buyer\'s ledger.',
    ],
  },
  {
    label: '3. Track Input Tax Credit (ITC)',
    icon: <BsWallet2 size={24} color="#2e7d32" />,
    description: `The ITC Ledger tracks the GST you've paid on your purchases (inputs) and the GST you've collected on your sales (outputs).`,
    action: 'View Ledger',
    path: '/ledger',
    tips: [
      'Output Tax: Tax you owe the government from your sales.',
      'Pending ITC: Your supplier created an invoice, but hasn\'t filed their return yet.',
      'Matched ITC: Your supplier filed their return, confirming your credit.',
    ],
  },
  {
    label: '4. Close Period & File Returns',
    icon: <BsCalendarCheck size={24} color="#0288d1" />,
    description: `At the end of a tax period (month), you must close it and file your returns to "pay" your net tax and pass on ITC to your buyers.`,
    action: 'Tax Periods',
    path: '/periods',
    tips: [
      'Closing Period: Generates GSTR-1 (declares your outward sales). Locks the period for new invoices.',
      'Filing Return: Generates GSTR-3B. Calculates Net Payable = (Output Tax - Matched ITC). Flips your buyers\' pending ITC to "Matched".',
    ],
  },
];

export default function HowToUse() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();

  return (
    <Box maxWidth={900} mx="auto">
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
        <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}>
          How to Use the Simulator
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.25rem' } }}>
          Welcome to the Aadhira Solutions GST sandbox. Follow this step-by-step guide to run your simulated business and learn the GST lifecycle.
        </Typography>
      </Box>

      {/* Explainer / Disclaimer */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 3, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 3, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <BsShieldCheck size={22} color="#2e7d32" />
              <Typography variant="h6" fontWeight={700} color="#2e7d32">100% Safe Sandbox</Typography>
            </Stack>
            <Typography variant="body2" color="#1b5e20" lineHeight={1.6}>
              This is an educational simulator. No real money is involved, no real government APIs are called, and the GSTINs are fictional. Feel free to make mistakes and experiment!
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 3, bgcolor: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 3, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <BsRobot size={22} color="#1565c0" />
              <Typography variant="h6" fontWeight={700} color="#1565c0">AI Tutor Available</Typography>
            </Stack>
            <Typography variant="body2" color="#0d47a1" lineHeight={1.6}>
              Stuck on a concept? Click the floating graduation cap icon in the bottom right corner. Mistral AI is ready to explain ITC, IGST, or any other GST concept in simple terms.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Step-by-Step Guide */}
      <Card sx={{ mb: 5, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stepper orientation="vertical" sx={{ '& .MuiStepConnector-line': { minHeight: 30 } }}>
            {guideSteps.map((step, index) => (
              <Step key={step.label} active={true}>
                <StepLabel
                  icon={
                    <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 1, zIndex: 1 }}>
                      {step.icon}
                    </Box>
                  }
                >
                  <Typography variant="h5" fontWeight={700} sx={{ ml: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent sx={{ ml: { xs: 2.75, md: 2.75 }, pl: { xs: 3, md: 4 }, borderLeft: '2px solid #e0e0e0' }}>
                  <Typography variant="body1" sx={{ mt: 1, mb: 3, color: 'text.secondary', lineHeight: 1.7, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    {step.description}
                  </Typography>

                  <Box sx={{ bgcolor: '#f8f9fa', p: { xs: 2, md: 2.5 }, borderRadius: 2, mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <BsLightbulbFill size={18} color="#e07b00" />
                      <Typography fontWeight={700} fontSize="0.9rem">Pro Tips</Typography>
                    </Stack>
                    <Stack spacing={1} component="ul" sx={{ pl: 2, m: 0 }}>
                      {step.tips.map((tip, i) => (
                        <Typography component="li" key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {tip}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>

                  <Button
                    variant="contained" size={isMobile ? 'medium' : 'large'}
                    onClick={() => navigate(step.path)}
                    sx={{ mb: 2, borderRadius: 2, px: 3 }}
                  >
                    {step.action}
                  </Button>
                  {index < guideSteps.length - 1 && <Divider sx={{ my: 3 }} />}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      
      {/* Final Call to Action */}
      <Box sx={{ textAlign: 'center', pb: 4 }}>
         <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Ready to test your knowledge?</Typography>
         <Button variant="outlined" color="primary" size="large" onClick={() => navigate('/quiz')} sx={{ borderRadius: 2, px: 4, py: 1.2 }}>
            Take the AI GST Quiz
         </Button>
      </Box>
    </Box>
  );
}

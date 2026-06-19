import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper, Slide } from '@mui/material';
import { BsRobot, BsPlayCircle, BsStopCircle } from 'react-icons/bs';
import { useAppStore } from '../store/useAppStore.js';
import { useNavigate } from 'react-router-dom';

const TOUR_STEPS = {
  1: {
    title: "Step 1: Registering a Business",
    message: "Welcome to the simulator! The very first thing a business needs is a GSTIN. Watch as we automatically fill out the registration form to create a new simulated company.",
    path: "/register-business"
  },
  2: {
    title: "Step 2: Creating a Sales Invoice",
    message: "Great! Our business is created. Now, let's make a sale. When you sell goods, you collect Output Tax from the customer. Let's auto-fill a sales invoice for some electronics.",
    path: "/invoices/new"
  },
  3: {
    title: "Step 3: Checking the ITC Ledger",
    message: "Invoice saved! Because we collected tax on that sale, we now owe the government money. Let's look at the ITC Ledger to see our Output Tax Liability.",
    path: "/ledger"
  },
  4: {
    title: "Step 4: Filing Returns (GSTR-3B)",
    message: "At the end of the month, businesses must file their GSTR-3B return to pay their taxes. Let's auto-file our return to complete the compliance cycle!",
    path: "/periods"
  },
  5: {
    title: "Tour Complete! 🎉",
    message: "You've successfully simulated a full GST cycle! You can now explore the app manually or create more invoices.",
    path: "/"
  }
};

export default function AutoPilotEngine() {
  const { isTourActive, tourStep, endTour, nextTourStep } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isTourActive && TOUR_STEPS[tourStep]) {
      // Force navigation to the correct page for this step
      navigate(TOUR_STEPS[tourStep].path);
      
      // If it's the final step, auto-close after 6 seconds
      if (tourStep === 5) {
        const timer = setTimeout(() => {
          endTour();
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [isTourActive, tourStep, navigate, endTour]);

  if (!isTourActive || tourStep === 0) return null;

  const currentInfo = TOUR_STEPS[tourStep];

  return (
    <Slide direction="up" in={isTourActive} mountOnEnter unmountOnExit>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '90%', md: 600 },
          zIndex: 9999,
          borderRadius: 4,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 3, gap: 2 }}>
          <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 1.5,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BsRobot size={32} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800} color="primary.main" gutterBottom>
              {currentInfo.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {currentInfo.message}
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                variant="text" 
                color="error" 
                startIcon={<BsStopCircle />}
                onClick={endTour}
                size="small"
              >
                Stop Tour
              </Button>
              {tourStep < 5 && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={nextTourStep}
                  size="small"
                  sx={{ display: 'none' }} // Hidden, triggered automatically by components
                >
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        {/* Progress bar visual */}
        <Box sx={{ height: 4, width: '100%', bgcolor: 'rgba(0,0,0,0.05)' }}>
          <Box sx={{ 
            height: '100%', 
            bgcolor: 'primary.main', 
            width: `${(tourStep / 5) * 100}%`,
            transition: 'width 0.5s ease'
          }} />
        </Box>
      </Paper>
    </Slide>
  );
}

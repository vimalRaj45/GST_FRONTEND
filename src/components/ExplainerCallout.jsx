import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function ExplainerCallout({ title, children, severity = 'info', sx = {} }) {
  return (
    <Alert
      severity={severity}
      icon={<InfoOutlinedIcon />}
      sx={{
        mb: 3,
        borderRadius: 2,
        '& .MuiAlert-message': { width: '100%' },
        ...sx,
      }}
    >
      {title && <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>}
      <Box sx={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{children}</Box>
    </Alert>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent,
  Alert, Stack, CircularProgress, Grid, Chip, Divider,
  Tabs, Tab, TextField, MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BsBuilding, BsPlay, BsPlusCircle, BsArrowLeftRight } from 'react-icons/bs';
import { getUnassignedBusinesses, claimBusiness, createBusiness } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import useProgressStore from '../store/useProgressStore.js';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export default function RegisterBusiness() {
  const [tabValue, setTabValue] = useState(0);
  const [unassigned, setUnassigned] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);

  // Custom business form state
  const [customName, setCustomName] = useState('');
  const [customState, setCustomState] = useState('Maharashtra');
  const [customScheme, setCustomScheme] = useState('regular');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const setBusiness = useAppStore((s) => s.setBusiness);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const business = useAppStore((s) => s.business);
  const sessionId = useAppStore((s) => s.sessionId);
  const { markModule } = useProgressStore();

  useEffect(() => {
    fetchUnassigned();
  }, [isAuthenticated]);

  const fetchUnassigned = async () => {
    try {
      const data = await getUnassignedBusinesses();
      setUnassigned(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch business scenarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedId) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await claimBusiness(selectedId);
      setBusiness(res);
      markModule('registeredBusiness');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to claim business scenario.');
    } finally {
      setClaiming(false);
    }
  };

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createBusiness({
        name: customName.trim(),
        state: customState,
        scheme_type: customScheme,
        session_id: sessionId
      });
      const businessObj = res.business || res;
      setBusiness(businessObj);
      markModule('registeredBusiness');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create custom business.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 0, sm: 1 } }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} color="#1a3c6e" gutterBottom>
          Simulated Business Workspace
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Choose a predefined learning scenario or spin up your own custom simulated business workspace.
        </Typography>
      </Box>

      {/* Warning if business already active */}
      {business && (
        <Alert severity="warning" icon={<BsArrowLeftRight size={18} />} sx={{ mb: 4, borderRadius: 2 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>Active Workspace Alert</Typography>
          <Typography variant="body2">
            You are currently working on <strong>{business.name}</strong> ({business.gstin}).
            Choosing a different scenario or creating a new custom business will change your active workspace.
            All invoices and filing records for your current business are saved and will remain intact.
          </Typography>
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}



      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, val) => { setTabValue(val); setError(null); }} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Predefined Scenarios" sx={{ fontWeight: 700, fontSize: '0.9rem' }} />
          <Tab label="Create Custom Business" sx={{ fontWeight: 700, fontSize: '0.9rem' }} />
        </Tabs>
      </Box>

      {/* ── Tab 0: Predefined Scenarios ── */}
      {tabValue === 0 && (
        unassigned.length === 0 ? (
          <Card sx={{ border: '1px dashed rgba(0,0,0,0.15)', p: 3, textAlign: 'center', borderRadius: 2 }}>
            <CardContent>
              <BsBuilding size={48} color="#ccc" style={{ marginBottom: 16 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No Templates Available
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                No unassigned simulation scenario templates are left in your training institute dashboard.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                You can head over to the **Create Custom Business** tab to generate your own custom simulation scenario!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            <Grid container spacing={2.5}>
              {unassigned.map((biz) => {
                const isSelected = selectedId === biz.id;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={biz.id}>
                    <Card 
                      onClick={() => setSelectedId(biz.id)}
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'rgba(26,60,110,0.03)' : 'background.paper',
                        boxShadow: isSelected ? '0 8px 24px rgba(26,60,110,0.08)' : 'none',
                        transition: 'all 0.2s ease',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: isSelected ? 'primary.main' : 'primary.light',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" fontWeight={700} color="#1a3c6e">
                            {biz.name}
                          </Typography>
                          <Chip 
                            label={biz.scheme_type === 'regular' ? 'Regular Scheme' : 'Composition Scheme'} 
                            color={biz.scheme_type === 'regular' ? 'info' : 'warning'} 
                            size="small" 
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Stack spacing={1} sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>State:</span>
                            <strong>{biz.state}</strong>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>State Code:</span>
                            <strong>{biz.state_code}</strong>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Mock GSTIN:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{biz.gstin}</span>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                disabled={claiming || !selectedId}
                onClick={handleClaim}
                startIcon={claiming ? <CircularProgress size={18} color="inherit" /> : <BsPlay size={20} />}
                sx={{ px: 6, py: 1.5, borderRadius: 3, fontWeight: 700 }}
              >
                {claiming ? 'Activating Scenario...' : 'Launch Selected Scenario'}
              </Button>
            </Box>
          </Stack>
        )
      )}

      {/* ── Tab 1: Create Custom Business ── */}
      {tabValue === 1 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleCreateCustom}>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700} color="#1a3c6e">
                  Custom Simulation Parameters
                </Typography>
                <Divider />

                <TextField
                  label="Business Name"
                  placeholder="e.g. Aadhira Supermarket, TechLabs Solutions"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  fullWidth
                  required
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="State (GST Jurisdiction)"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      fullWidth
                    >
                      {INDIAN_STATES.map((st) => (
                        <MenuItem key={st} value={st}>{st}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="GST Tax Scheme"
                      value={customScheme}
                      onChange={(e) => setCustomScheme(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="regular">Regular Scheme (Tax Invoice, Collect GST, Claim ITC)</MenuItem>
                      <MenuItem value="composition">Composition Scheme (Bill of Supply, Flat 1% Rate, No ITC)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 1, borderRadius: 1.5 }}>
                  <Typography variant="caption" display="block">
                    <strong>Note:</strong> We will automatically generate a valid 15-digit mock GSTIN matching the state code you selected.
                    If you choose the **Regular Scheme**, we will pre-seed purchase invoices so you can practice Input Tax Credit matching.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    color="primary"
                    disabled={creating || !customName.trim()}
                    startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <BsPlusCircle size={18} />}
                    sx={{ px: 4, py: 1.25, borderRadius: 3, fontWeight: 700 }}
                  >
                    {creating ? 'Creating Workspace...' : 'Create & Launch Business'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

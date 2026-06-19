import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Tabs, Tab, Grid, IconButton
} from '@mui/material';
import { BsPersonBadge, BsBuildingAdd, BsCheckCircle, BsTrash, BsPencil } from 'react-icons/bs';
import { 
  getAdminStats, getStudents, getAllBusinesses, createBusinessForStudent,
  getAdminTaxSlabs, createTaxSlab, updateTaxSlab, deleteTaxSlab,
  getAdminHsnCodes, createHsnCode, updateHsnCode, deleteHsnCode
} from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';

const STATES = [
  'Andhra Pradesh','Gujarat','Karnataka','Maharashtra','Delhi','Tamil Nadu'
];

export default function AdminDashboard() {
  const { user } = useAppStore();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState({ students: 0, businesses: 0, invoices: 0 });
  const [students, setStudents] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);

  // Modals
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', state: 'Maharashtra', scheme_type: 'regular' });

  const [taxSlabModalOpen, setTaxSlabModalOpen] = useState(false);
  const [selectedTaxSlab, setSelectedTaxSlab] = useState(null);
  const [taxSlabForm, setTaxSlabForm] = useState({ rate: '', label: '', description: '' });

  const [hsnModalOpen, setHsnModalOpen] = useState(false);
  const [selectedHsn, setSelectedHsn] = useState(null);
  const [hsnForm, setHsnForm] = useState({ code: '', description: '', default_tax_slab_id: '' });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, studentsData, businessesData, taxSlabsData, hsnCodesData] = await Promise.all([
        getAdminStats(), getStudents(), getAllBusinesses(), getAdminTaxSlabs(), getAdminHsnCodes()
      ]);
      setStats(statsData);
      setStudents(studentsData);
      setBusinesses(businessesData);
      setTaxSlabs(taxSlabsData);
      setHsnCodes(hsnCodesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleAssignBusiness = async () => {
    setSaving(true);
    try {
      await createBusinessForStudent({ ...studentForm, student_id: selectedStudent.id });
      setStudentModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxSlab = async () => {
    setSaving(true);
    try {
      if (selectedTaxSlab) {
        await updateTaxSlab(selectedTaxSlab.id, taxSlabForm);
      } else {
        await createTaxSlab(taxSlabForm);
      }
      setTaxSlabModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTaxSlab = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteTaxSlab(id);
      fetchData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleSaveHsnCode = async () => {
    setSaving(true);
    try {
      if (selectedHsn) {
        await updateHsnCode(selectedHsn.id, hsnForm);
      } else {
        await createHsnCode(hsnForm);
      }
      setHsnModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHsnCode = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteHsnCode(id);
      fetchData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <BsPersonBadge size={32} color="#c62828" />
        <Typography variant="h4" fontWeight={800} color="primary.main">
          Admin Dashboard
        </Typography>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
          <Tab label="Dashboard" />
          <Tab label="Students" />
          <Tab label="All Businesses" />
          <Tab label="Tax Slabs" />
          <Tab label="HSN Codes" />
        </Tabs>
      </Box>

      {/* TAB 0: Dashboard */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(26,60,110,0.05)', border: '1px solid rgba(26,60,110,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main" fontWeight={800}>{stats.students}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Students</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" fontWeight={800}>{stats.businesses}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Businesses</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(237,108,2,0.05)', border: '1px solid rgba(237,108,2,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" fontWeight={800}>{stats.invoices}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Invoices</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Students */}
      {tabIndex === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Registered Students</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell fontWeight={600}>{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small" variant="outlined" color="primary"
                          startIcon={<BsBuildingAdd />}
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentForm({ name: '', state: 'Maharashtra', scheme_type: 'regular' });
                            setStudentModalOpen(true);
                          }}
                        >
                          Assign Business
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No students registered yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Businesses */}
      {tabIndex === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>All Businesses</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Business Name</TableCell>
                    <TableCell>GSTIN</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {businesses.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell fontWeight={600}>{b.name}</TableCell>
                      <TableCell>{b.gstin}</TableCell>
                      <TableCell>{b.state}</TableCell>
                      <TableCell>{b.owner_name || 'System'}</TableCell>
                      <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Tax Slabs */}
      {tabIndex === 3 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">Tax Slabs</Typography>
              <Button variant="contained" onClick={() => {
                setSelectedTaxSlab(null);
                setTaxSlabForm({ rate: '', label: '', description: '' });
                setTaxSlabModalOpen(true);
              }}>Add Tax Slab</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Rate (%)</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxSlabs.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell fontWeight={600}>{t.label}</TableCell>
                      <TableCell>{t.rate}%</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => {
                          setSelectedTaxSlab(t);
                          setTaxSlabForm({ rate: t.rate, label: t.label, description: t.description || '' });
                          setTaxSlabModalOpen(true);
                        }}><BsPencil /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteTaxSlab(t.id)}><BsTrash /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: HSN Codes */}
      {tabIndex === 4 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">HSN Codes</Typography>
              <Button variant="contained" onClick={() => {
                setSelectedHsn(null);
                setHsnForm({ code: '', description: '', default_tax_slab_id: '' });
                setHsnModalOpen(true);
              }}>Add HSN Code</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Default Tax</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hsnCodes.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell fontWeight={600}>{h.code}</TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell>{h.tax_label || 'None'} ({h.tax_rate}%)</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => {
                          setSelectedHsn(h);
                          setHsnForm({ code: h.code, description: h.description, default_tax_slab_id: h.default_tax_slab_id || '' });
                          setHsnModalOpen(true);
                        }}><BsPencil /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteHsnCode(h.id)}><BsTrash /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <Dialog open={studentModalOpen} onClose={() => setStudentModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Business to {selectedStudent?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Business Name" fullWidth value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
            <TextField select label="State" fullWidth value={studentForm.state} onChange={e => setStudentForm({ ...studentForm, state: e.target.value })}>
              {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Scheme" fullWidth value={studentForm.scheme_type} onChange={e => setStudentForm({ ...studentForm, scheme_type: e.target.value })}>
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="composition">Composition</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStudentModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignBusiness} variant="contained" disabled={saving || !studentForm.name}>Assign Business</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={taxSlabModalOpen} onClose={() => setTaxSlabModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTaxSlab ? 'Edit' : 'Add'} Tax Slab</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Label (e.g. GST 18%)" fullWidth value={taxSlabForm.label} onChange={e => setTaxSlabForm({ ...taxSlabForm, label: e.target.value })} />
            <TextField label="Rate (%)" type="number" fullWidth value={taxSlabForm.rate} onChange={e => setTaxSlabForm({ ...taxSlabForm, rate: e.target.value })} />
            <TextField label="Description" fullWidth value={taxSlabForm.description} onChange={e => setTaxSlabForm({ ...taxSlabForm, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTaxSlabModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTaxSlab} variant="contained" disabled={saving || !taxSlabForm.label || !taxSlabForm.rate}>Save Tax Slab</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={hsnModalOpen} onClose={() => setHsnModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedHsn ? 'Edit' : 'Add'} HSN Code</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="HSN Code" fullWidth value={hsnForm.code} onChange={e => setHsnForm({ ...hsnForm, code: e.target.value })} />
            <TextField label="Description" fullWidth multiline rows={3} value={hsnForm.description} onChange={e => setHsnForm({ ...hsnForm, description: e.target.value })} />
            <TextField select label="Default Tax Slab" fullWidth value={hsnForm.default_tax_slab_id} onChange={e => setHsnForm({ ...hsnForm, default_tax_slab_id: e.target.value })}>
              <MenuItem value=""><em>None</em></MenuItem>
              {taxSlabs.map(t => <MenuItem key={t.id} value={t.id}>{t.label} ({t.rate}%)</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHsnModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveHsnCode} variant="contained" disabled={saving || !hsnForm.code || !hsnForm.description}>Save HSN Code</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress
} from '@mui/material';
import { BsPersonBadge, BsBuildingAdd, BsCheckCircle } from 'react-icons/bs';
import { getStudents, createBusinessForStudent } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';

const STATES = [
  'Andhra Pradesh','Gujarat','Karnataka','Maharashtra','Delhi','Tamil Nadu'
];

export default function AdminDashboard() {
  const { user } = useAppStore();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ name: '', state: 'Maharashtra', scheme_type: 'regular' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setForm({ name: '', state: 'Maharashtra', scheme_type: 'regular' });
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await createBusinessForStudent({
        ...form,
        student_id: selectedStudent.id
      });
      setOpen(false);
      // Let's just alert success for now.
      alert(`Business successfully created and assigned to ${selectedStudent.name}!`);
    } catch (err) {
      alert('Failed to assign business: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <BsPersonBadge size={32} color="#c62828" />
        <Typography variant="h4" fontWeight={800} color="primary.main">
          Admin Dashboard
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Registered Students</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
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
                        onClick={() => handleOpenModal(s)}
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Business to {selectedStudent?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Business Name" fullWidth required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              select label="State" fullWidth required
              value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
            >
              {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField
              select label="Scheme" fullWidth required
              value={form.scheme_type} onChange={e => setForm({ ...form, scheme_type: e.target.value })}
            >
              <MenuItem value="regular">Regular Scheme</MenuItem>
              <MenuItem value="composition">Composition Scheme</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving || !form.name}>
            {saving ? 'Assigning...' : 'Assign Business'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Tabs, Tab, Grid, IconButton
} from '@mui/material';
import {
  BsPersonBadge, BsBuildingAdd, BsBuilding, BsCheckCircle, BsTrash,
  BsPencil, BsPlus, BsArrowUp, BsArrowDown, BsGraphUp, BsLightningCharge,
  BsBarChart, BsPercent, BsTag, BsPeople, BsEnvelopeOpen, BsMortarboard, BsClipboardCheck
} from 'react-icons/bs';
import { 
  getAdminStats, getStudents, getAllBusinesses, createBusinessForStudent,
  getAdminTaxSlabs, createTaxSlab, updateTaxSlab, deleteTaxSlab,
  getAdminHsnCodes, createHsnCode, updateHsnCode, deleteHsnCode,
  getClients, generateClientInvite, getClientInvites, toggleClientStatus, renewClientSubscription, updateClientLimit, deleteClient, deleteClientInvite,
  approveStudent, deleteStudent,
  getCustomQuizzes, generateCustomQuizQuestion, createCustomQuiz, getCustomQuizDetails, updateCustomQuiz, approveCustomQuiz, deleteCustomQuiz
} from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import { usePolling } from '../hooks/usePolling.js';

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
  const [clients, setClients] = useState([]);
  const [clientInvites, setClientInvites] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // Quizzes Modals
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', questions: [] });
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [quizStats, setQuizStats] = useState(null);

  // AI Quiz Generator inputs
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionType, setAiQuestionType] = useState('mcq');
  const [aiGenerating, setAiGenerating] = useState(false);

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

  // Super Admin modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', expires_in_days: '7', student_limit: '50' });
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [renewForm, setRenewForm] = useState({ days: '30' });
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitForm, setLimitForm] = useState({ student_limit: '50' });

  const [saving, setSaving] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioForm, setScenarioForm] = useState({ name: '', state: 'Maharashtra', scheme_type: 'regular' });

  const fetchData = useCallback(async () => {
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
  }, []);

  const fetchRoleData = useCallback(async () => {
    if (!user?.role) return;
    try {
      if (user.role === 'super_admin') {
        const [clientsData, invitesData] = await Promise.all([
          getClients(), getClientInvites()
        ]);
        setClients(clientsData);
        setClientInvites(invitesData);
      } else if (user.role === 'client') {
        const quizzesData = await getCustomQuizzes();
        setQuizzes(quizzesData);
      }
    } catch (err) {
      console.error('Role data fetch error:', err);
    }
  }, [user?.role]);

  // Poll general data every 30s
  usePolling(fetchData, 30000);
  // Poll role-specific data every 30s, only when role is known
  usePolling(fetchRoleData, 30000, !!user?.role);

  // --- Super Admin Handlers ---
  const handleGenerateInvite = async () => {
    setSaving(true);
    try {
      await generateClientInvite(inviteForm);
      setInviteModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Invite code generated successfully!');
    } catch (err) {
      toast.error('Failed to generate invite: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClientStatus = async (id) => {
    try {
      await toggleClientStatus(id);
      // Optimistic update
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c));
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Client status updated!');
    } catch (err) {
      toast.error('Failed to toggle status: ' + err.message);
    }
  };

  const handleRenewClient = async () => {
    setSaving(true);
    try {
      await renewClientSubscription(selectedClient.id, renewForm);
      setRenewModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Client subscription renewed!');
    } catch (err) {
      toast.error('Failed to renew subscription: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLimit = async () => {
    setSaving(true);
    try {
      await updateClientLimit(selectedClient.id, limitForm);
      setLimitModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Client student limit updated!');
    } catch (err) {
      toast.error('Failed to update student limit: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (id) => {
    Swal.fire({
      title: 'Delete Client?',
      text: 'WARNING: Are you sure you want to delete this Client? This will also delete all their registered students and student simulated businesses! This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, delete client'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteClient(id);
          setClients(prev => prev.filter(c => c.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Client deleted successfully');
        } catch (err) {
          toast.error('Failed to delete client: ' + err.message);
        }
      }
    });
  };

  const handleRevokeInvite = async (id) => {
    Swal.fire({
      title: 'Revoke Invite?',
      text: 'Are you sure you want to revoke/delete this invite code?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, revoke invite'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteClientInvite(id);
          setClientInvites(prev => prev.filter(ci => ci.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Invite code revoked');
        } catch (err) {
          toast.error('Failed to revoke invite: ' + err.message);
        }
      }
    });
  };

  const handleCreateScenario = async () => {
    setSaving(true);
    try {
      await createBusinessForStudent(scenarioForm);
      setScenarioModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Business scenario created successfully!');
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers ---
  const handleAssignBusiness = async () => {
    setSaving(true);
    try {
      await createBusinessForStudent({ ...studentForm, student_id: selectedStudent.id });
      setStudentModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Business assigned successfully!');
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveStudent = async (id) => {
    try {
      await approveStudent(id);
      // Optimistic update
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
      await Promise.all([fetchData(), fetchRoleData()]);
      toast.success('Student approved successfully!');
    } catch (err) {
      toast.error('Failed to approve student: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    Swal.fire({
      title: 'Delete Student?',
      text: 'Are you sure you want to delete this student? This will also delete their business and all related invoices/filings. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, delete student'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteStudent(id);
          setStudents(prev => prev.filter(s => s.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Student deleted successfully');
        } catch (err) {
          toast.error('Failed to delete student: ' + err.message);
        }
      }
    });
  };

  const handleGenerateQuestion = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic for AI generation');
      return;
    }
    setAiGenerating(true);
    try {
      const q = await generateCustomQuizQuestion(aiTopic, aiQuestionType);
      setQuizForm(prev => ({
        ...prev,
        questions: [
          ...prev.questions,
          {
            question_text: q.question_text,
            question_type: aiQuestionType,
            options: q.options || (aiQuestionType === 'fill_in_the_blanks' ? null : ['', '', '', '']),
            correct_answers: q.correct_answers || [],
            explanation: q.explanation || '',
            sort_order: prev.questions.length
          }
        ]
      }));
      toast.success('AI question generated and appended!');
      setAiTopic('');
    } catch (err) {
      toast.error('AI generation failed: ' + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_type: 'mcq',
          options: ['', '', '', ''],
          correct_answers: [0],
          explanation: '',
          sort_order: prev.questions.length
        }
      ]
    }));
  };

  const handleUpdateQuestion = (index, updates) => {
    setQuizForm(prev => {
      const qs = [...prev.questions];
      qs[index] = { ...qs[index], ...updates };
      if (updates.question_type) {
        if (updates.question_type === 'fill_in_the_blanks') {
          qs[index].options = null;
          qs[index].correct_answers = [''];
        } else {
          qs[index].options = qs[index].options || ['', '', '', ''];
          qs[index].correct_answers = [0];
        }
      }
      return { ...prev, questions: qs };
    });
  };

  const handleRemoveQuestion = (index) => {
    setQuizForm(prev => {
      const qs = prev.questions.filter((_, i) => i !== index);
      return {
        ...prev,
        questions: qs.map((q, i) => ({ ...q, sort_order: i }))
      };
    });
  };

  const handleMoveQuestion = (index, direction) => {
    setQuizForm(prev => {
      const qs = [...prev.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= qs.length) return prev;
      const temp = qs[index];
      qs[index] = qs[targetIndex];
      qs[targetIndex] = temp;
      return {
        ...prev,
        questions: qs.map((q, i) => ({ ...q, sort_order: i }))
      };
    });
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (quizForm.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      const qNum = i + 1;
      if (!q.question_text.trim()) {
        toast.error(`Question #${qNum} is empty`);
        return;
      }
      if (q.question_type === 'fill_in_the_blanks') {
        if (!q.correct_answers || q.correct_answers.length === 0 || !String(q.correct_answers[0]).trim()) {
          toast.error(`Question #${qNum} needs a correct answer value`);
          return;
        }
      } else {
        if (q.options.some(opt => !opt.trim())) {
          toast.error(`Question #${qNum} has empty options`);
          return;
        }
        if (!q.correct_answers || q.correct_answers.length === 0) {
          toast.error(`Question #${qNum} must have at least one correct option selected`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      if (selectedQuiz) {
        await updateCustomQuiz(selectedQuiz.id, quizForm);
        toast.success('Quiz updated successfully');
      } else {
        await createCustomQuiz(quizForm);
        toast.success('Quiz created as draft!');
      }
      setQuizModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
    } catch (err) {
      toast.error('Failed to save quiz: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveQuiz = async (id) => {
    Swal.fire({
      title: 'Publish Quiz?',
      text: 'Are you sure you want to approve and publish this quiz? Your students will be able to take it immediately.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e7d32',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, publish it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await approveCustomQuiz(id);
          // Optimistic update
          setQuizzes(prev => prev.map(q => q.id === id ? { ...q, status: 'approved' } : q));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Quiz published successfully!');
        } catch (err) {
          toast.error('Failed to publish quiz: ' + err.message);
        }
      }
    });
  };

  const handleDeleteQuiz = async (id) => {
    Swal.fire({
      title: 'Delete Quiz?',
      text: 'Are you sure you want to delete this custom quiz? All student attempts will also be deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, delete quiz'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCustomQuiz(id);
          setQuizzes(prev => prev.filter(q => q.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Quiz deleted successfully');
        } catch (err) {
          toast.error('Failed to delete quiz: ' + err.message);
        }
      }
    });
  };

  const handleViewQuizStats = async (quiz) => {
    try {
      const details = await getCustomQuizDetails(quiz.id);
      setQuizStats(details);
      setStatsModalOpen(true);
    } catch (err) {
      toast.error('Failed to load quiz details: ' + err.message);
    }
  };

  const handleSaveTaxSlab = async () => {
    setSaving(true);
    try {
      if (selectedTaxSlab) {
        await updateTaxSlab(selectedTaxSlab.id, taxSlabForm);
        toast.success('Tax slab updated!');
      } else {
        await createTaxSlab(taxSlabForm);
        toast.success('Tax slab created!');
      }
      setTaxSlabModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTaxSlab = async (id) => {
    Swal.fire({
      title: 'Delete Tax Slab?',
      text: 'Are you sure you want to delete this tax slab?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, delete it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTaxSlab(id);
          setTaxSlabs(prev => prev.filter(t => t.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('Tax slab deleted');
        } catch (err) {
          toast.error('Failed: ' + err.message);
        }
      }
    });
  };

  const handleSaveHsnCode = async () => {
    setSaving(true);
    try {
      if (selectedHsn) {
        await updateHsnCode(selectedHsn.id, hsnForm);
        toast.success('HSN code updated!');
      } else {
        await createHsnCode(hsnForm);
        toast.success('HSN code created!');
      }
      setHsnModalOpen(false);
      await Promise.all([fetchData(), fetchRoleData()]);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHsnCode = async (id) => {
    Swal.fire({
      title: 'Delete HSN Code?',
      text: 'Are you sure you want to delete this HSN code?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#1a3c6e',
      confirmButtonText: 'Yes, delete it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteHsnCode(id);
          setHsnCodes(prev => prev.filter(h => h.id !== id));
          await Promise.all([fetchData(), fetchRoleData()]);
          toast.success('HSN code deleted');
        } catch (err) {
          toast.error('Failed: ' + err.message);
        }
      }
    });
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <BsPersonBadge size={32} color="#c62828" />
          <Typography variant="h4" fontWeight={800} color="primary.main">
            {user?.role === 'super_admin' ? 'Super Admin Dashboard' : 'Institute Dashboard'}
          </Typography>
        </Stack>
        {user?.role === 'client' && (
          <Box sx={{ p: 1.5, px: 2.5, bgcolor: 'rgba(26,60,110,0.05)', borderRadius: 3, border: '1px solid rgba(26,60,110,0.12)' }}>
            <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Student Invite Code</Typography>
                <Typography variant="body1" fontWeight={800} color="primary.main">{user?.invite_code || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Students Registered</Typography>
                <Typography variant="body1" fontWeight={800} color="primary.main">
                  {students.filter(s => s.status === 'active').length} / {user?.student_limit || 50}
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(user?.invite_code);
                  toast.success('Student invite code copied to clipboard!');
                }}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Copy
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabScrollButton-root': {
              width: 32,
              '&.Mui-disabled': { opacity: 0.2 },
            },
          }}
        >
          {/* ── SUPER ADMIN tabs ── */}
          {user?.role === 'super_admin' && <Tab icon={<BsBarChart size={16} />} iconPosition="start" label="Dashboard" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'super_admin' && <Tab icon={<BsBuilding size={16} />} iconPosition="start" label="Business Scenarios" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'super_admin' && <Tab icon={<BsPercent size={16} />} iconPosition="start" label="Tax Slabs" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'super_admin' && <Tab icon={<BsTag size={16} />} iconPosition="start" label="HSN Codes" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'super_admin' && <Tab icon={<BsPeople size={16} />} iconPosition="start" label="Clients" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'super_admin' && <Tab icon={<BsEnvelopeOpen size={16} />} iconPosition="start" label="Client Invites" sx={{ minHeight: 48, fontWeight: 600 }} />}

          {/* ── CLIENT (Institute) tabs ── */}
          {user?.role === 'client' && <Tab icon={<BsBarChart size={16} />} iconPosition="start" label="Dashboard" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'client' && <Tab icon={<BsMortarboard size={16} />} iconPosition="start" label="Students" sx={{ minHeight: 48, fontWeight: 600 }} />}
          {user?.role === 'client' && <Tab icon={<BsClipboardCheck size={16} />} iconPosition="start" label="Custom Quizzes" sx={{ minHeight: 48, fontWeight: 600 }} />}
        </Tabs>
      </Box>

      {/* TAB: Dashboard (index 0 for both roles) */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'rgba(26,60,110,0.05)', border: '1px solid rgba(26,60,110,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary.main" fontWeight={800}>{stats.students}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Students</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" fontWeight={800}>{stats.businesses}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Businesses</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ bgcolor: 'rgba(237,108,2,0.05)', border: '1px solid rgba(237,108,2,0.2)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main" fontWeight={800}>{stats.invoices}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Total Invoices</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB: Students — CLIENT tab index 1 */}
      {user?.role === 'client' && tabIndex === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Registered Students</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Business</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status === 'active' ? 'Active' : s.status === 'pending' ? 'Pending Approval' : s.status}
                          size="small"
                          color={s.status === 'active' ? 'success' : s.status === 'pending' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {s.business_id ? (
                          <Chip
                            label={s.business_name}
                            size="small"
                            variant="outlined"
                            color="info"
                            icon={<BsBuilding size={12} />}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          {s.status === 'pending' && (
                            <Button
                              size="small" variant="contained" color="success"
                              onClick={() => handleApproveStudent(s.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {s.status === 'active' && !s.business_id && (
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
                          )}
                          <IconButton
                            size="small" color="error"
                            onClick={() => handleDeleteStudent(s.id)}
                          >
                            <BsTrash size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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

      {/* TAB: Business Scenarios — SUPER ADMIN tab index 1 */}
      {user?.role === 'super_admin' && tabIndex === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">All Businesses & Templates</Typography>
              <Button variant="contained" onClick={() => {
                setScenarioForm({ name: '', state: 'Maharashtra', scheme_type: 'regular' });
                setScenarioModalOpen(true);
              }}>Create Business Scenario</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 550 }}>
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
                      <TableCell>
                        {b.owner_name ? (
                          b.owner_name
                        ) : (
                          <Chip label="Unassigned Scenario" size="small" variant="outlined" color="warning" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB: Tax Slabs — SUPER ADMIN tab index 2 */}
      {user?.role === 'super_admin' && tabIndex === 2 && (
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Tax Slabs</Typography>
              <Button variant="contained" onClick={() => {
                setSelectedTaxSlab(null);
                setTaxSlabForm({ rate: '', label: '', description: '' });
                setTaxSlabModalOpen(true);
              }}>Add Tax Slab</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 420 }}>
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

      {/* TAB: HSN Codes — SUPER ADMIN tab index 3 */}
      {user?.role === 'super_admin' && tabIndex === 3 && (
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">HSN Codes</Typography>
              <Button variant="contained" onClick={() => {
                setSelectedHsn(null);
                setHsnForm({ code: '', description: '', default_tax_slab_id: '' });
                setHsnModalOpen(true);
              }}>Add HSN Code</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 450 }}>
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

      {/* TAB: Clients — SUPER ADMIN tab index 4 */}
      {user?.role === 'super_admin' && tabIndex === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Registered Clients (Institutes)</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 750 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Student Code</TableCell>
                    <TableCell>Subscription Expiry</TableCell>
                    <TableCell>Students Limit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell fontWeight={600}>{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell><Chip label={c.invite_code || 'None'} size="small" variant="outlined" color="primary" /></TableCell>
                      <TableCell>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{c.student_count || 0} / {c.student_limit || 50}</TableCell>
                      <TableCell>
                        <Chip 
                          label={c.status} 
                          size="small" 
                          color={c.status === 'active' ? 'success' : 'error'} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            size="small" variant="outlined"
                            color={c.status === 'active' ? 'error' : 'success'}
                            onClick={() => handleToggleClientStatus(c.id)}
                          >
                            {c.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button
                            size="small" variant="contained" color="secondary"
                            onClick={() => {
                              setSelectedClient(c);
                              setRenewForm({ days: '30' });
                              setRenewModalOpen(true);
                            }}
                          >
                            Renew
                          </Button>
                          <Button
                            size="small" variant="outlined" color="primary"
                            onClick={() => {
                              setSelectedClient(c);
                              setLimitForm({ student_limit: String(c.student_limit || 50) });
                              setLimitModalOpen(true);
                            }}
                          >
                            Limit
                          </Button>
                          <Button
                            size="small" variant="contained" color="error"
                            onClick={() => handleDeleteClient(c.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No clients registered yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB: Client Invites — SUPER ADMIN tab index 5 */}
      {user?.role === 'super_admin' && tabIndex === 5 && (
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Client Registration Invites</Typography>
              <Button variant="contained" onClick={() => {
                setInviteForm({ email: '', expires_in_days: '7', student_limit: '50' });
                setInviteModalOpen(true);
              }}>Generate Invite Code</Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Invite Code</TableCell>
                    <TableCell>Email Target</TableCell>
                    <TableCell>Student Limit</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Redeemed By</TableCell>
                    <TableCell>Registration Link</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientInvites.map((ci) => {
                    const regUrl = `${window.location.origin}/register?code=${ci.code}`;
                    return (
                      <TableRow key={ci.id}>
                        <TableCell fontWeight={600}>{ci.code}</TableCell>
                        <TableCell>{ci.email || 'Any Email'}</TableCell>
                        <TableCell>{ci.student_limit || 50}</TableCell>
                        <TableCell>{new Date(ci.expires_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {ci.used_by_id ? (
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              {ci.used_by_name || 'Redeemed'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Unused
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {!ci.used_by_id ? (
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <TextField size="small" variant="outlined" readOnly value={regUrl} sx={{ width: 300, '& input': { fontSize: '0.8rem', py: 0.5 } }} />
                              <Button 
                                size="small" variant="outlined" 
                                onClick={() => {
                                  navigator.clipboard.writeText(regUrl);
                                  toast.success('Link copied to clipboard!');
                                }}
                              >
                                Copy
                              </Button>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Redeemed</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small" variant="outlined" color="error"
                            onClick={() => handleRevokeInvite(ci.id)}
                            disabled={!!ci.used_by_id}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {clientInvites.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No invite codes generated yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB: Custom Quizzes — CLIENT tab index 2 */}
      {user?.role === 'client' && tabIndex === 2 && (
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Custom Quizzes</Typography>
              <Button 
                variant="contained" 
                startIcon={<BsPlus />}
                onClick={() => {
                  setSelectedQuiz(null);
                  setQuizForm({ title: '', description: '', questions: [] });
                  setQuizModalOpen(true);
                }}
              >
                Create Quiz
              </Button>
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell>Quiz Title</TableCell>
                    <TableCell>Questions</TableCell>
                    <TableCell>Completions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quizzes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{q.title}</Typography>
                        {q.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {q.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{q.question_count}</TableCell>
                      <TableCell>{q.completion_count}</TableCell>
                      <TableCell>
                        <Chip 
                          label={q.status === 'approved' ? 'Published' : 'Draft'} 
                          size="small" 
                          color={q.status === 'approved' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          {q.status === 'draft' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => handleApproveQuiz(q.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<BsGraphUp />}
                            onClick={() => handleViewQuizStats(q)}
                          >
                            Stats
                          </Button>
                          <IconButton 
                            size="small" 
                            onClick={async () => {
                              setSelectedQuiz(q);
                              try {
                                const details = await getCustomQuizDetails(q.id);
                                setQuizForm({
                                  title: details.title,
                                  description: details.description || '',
                                  questions: details.questions.map(question => ({
                                    ...question,
                                    options: question.options || (question.question_type === 'fill_in_the_blanks' ? null : ['', '', '', ''])
                                  }))
                                });
                                setQuizModalOpen(true);
                              } catch (err) {
                                toast.error('Failed to load quiz details: ' + err.message);
                              }
                            }}
                          >
                            <BsPencil />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteQuiz(q.id)}
                          >
                            <BsTrash />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quizzes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No custom quizzes created yet. Click "Create Quiz" to add one!
                      </TableCell>
                    </TableRow>
                  )}
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

      {/* Super Admin: Generate Invite Dialog */}
      <Dialog open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Generate Client Invite Code</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField 
              label="Institute Email (Optional)" 
              placeholder="e.g. contact@institute.com (Leave empty for any email)"
              fullWidth 
              value={inviteForm.email} 
              onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} 
            />
            <TextField 
              label="Invite Expiration (Days)" 
              type="number" 
              fullWidth 
              value={inviteForm.expires_in_days} 
              onChange={e => setInviteForm({ ...inviteForm, expires_in_days: e.target.value })} 
            />
            <TextField 
              label="Student Limit" 
              type="number" 
              fullWidth 
              value={inviteForm.student_limit} 
              onChange={e => setInviteForm({ ...inviteForm, student_limit: e.target.value })} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInviteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateInvite} variant="contained" disabled={saving || !inviteForm.expires_in_days}>Generate Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Super Admin: Renew Client Subscription Dialog */}
      <Dialog open={renewModalOpen} onClose={() => setRenewModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Renew Subscription for {selectedClient?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Expiry Date: {selectedClient?.expires_at ? new Date(selectedClient.expires_at).toLocaleDateString() : 'N/A'}
            </Typography>
            <TextField 
              label="Days to Add" 
              type="number" 
              fullWidth 
              value={renewForm.days} 
              onChange={e => setRenewForm({ ...renewForm, days: e.target.value })} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRenewModalOpen(false)}>Cancel</Button>
          <Button onClick={handleRenewClient} variant="contained" disabled={saving || !renewForm.days}>Renew Subscription</Button>
        </DialogActions>
      </Dialog>

      {/* Super Admin: Update Student Limit Dialog */}
      <Dialog open={limitModalOpen} onClose={() => setLimitModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Student Limit for {selectedClient?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField 
              label="Max Students allowed" 
              type="number" 
              fullWidth 
              value={limitForm.student_limit} 
              onChange={e => setLimitForm({ ...limitForm, student_limit: e.target.value })} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLimitModalOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateLimit} variant="contained" disabled={saving || !limitForm.student_limit}>Save Limit</Button>
        </DialogActions>
      </Dialog>

      {/* Admin: Create Business Scenario Dialog */}
      <Dialog open={scenarioModalOpen} onClose={() => setScenarioModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Business Scenario</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Business Name" fullWidth value={scenarioForm.name} onChange={e => setScenarioForm({ ...scenarioForm, name: e.target.value })} />
            <TextField select label="State" fullWidth value={scenarioForm.state} onChange={e => setScenarioForm({ ...scenarioForm, state: e.target.value })}>
              {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Scheme" fullWidth value={scenarioForm.scheme_type} onChange={e => setScenarioForm({ ...scenarioForm, scheme_type: e.target.value })}>
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="composition">Composition</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScenarioModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateScenario} variant="contained" disabled={saving || !scenarioForm.name}>Create Scenario</Button>
        </DialogActions>
      </Dialog>

      {/* Custom Quiz Creator Dialog */}
      <Dialog open={quizModalOpen} onClose={() => setQuizModalOpen(false)} fullWidth maxWidth="lg" scroll="paper">
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', px: 3, py: 2 }}>
          {selectedQuiz ? 'Edit Custom Quiz' : 'Create Custom Quiz'}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={3}>
            {/* Left Column: AI Assistant Helper */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, position: 'sticky', top: 0, border: '1px solid rgba(26,60,110,0.15)', borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BsLightningCharge color="#ed6c02" /> AI Question Generator
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Use Mistral AI to draft quiz questions. Select a topic and format, then generate and customize.
                </Typography>
                <Stack spacing={2}>
                  <TextField 
                    label="Topic / Section" 
                    placeholder="e.g. Section 16 eligibility of ITC" 
                    fullWidth 
                    value={aiTopic} 
                    onChange={e => setAiTopic(e.target.value)} 
                  />
                  <TextField 
                    select 
                    label="Question Type" 
                    fullWidth 
                    value={aiQuestionType} 
                    onChange={e => setAiQuestionType(e.target.value)}
                  >
                    <MenuItem value="mcq">Single Choice (MCQ)</MenuItem>
                    <MenuItem value="multiple_select">Multiple Select</MenuItem>
                    <MenuItem value="fill_in_the_blanks">Fill in the Blanks</MenuItem>
                  </TextField>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleGenerateQuestion} 
                    disabled={aiGenerating}
                    sx={{ py: 1, fontWeight: 700 }}
                  >
                    {aiGenerating ? <CircularProgress size={24} color="inherit" /> : 'Generate with AI'}
                  </Button>
                </Stack>
              </Card>
            </Grid>

            {/* Right Column: Quiz Details and Questions List */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Quiz Metadata */}
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <TextField 
                      label="Quiz Title" 
                      fullWidth 
                      value={quizForm.title} 
                      onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} 
                      placeholder="e.g. GST Input Tax Credit Assessment"
                    />
                    <TextField 
                      label="Description (Optional)" 
                      fullWidth 
                      multiline 
                      rows={2} 
                      value={quizForm.description} 
                      onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} 
                      placeholder="e.g. Test students' practical understanding of Section 16 requirements..."
                    />
                  </Stack>
                </Card>

                {/* Questions Header */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    Questions ({quizForm.questions.length})
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<BsPlus />}
                    onClick={handleAddManualQuestion}
                    sx={{ fontWeight: 700 }}
                  >
                    Add Question Manually
                  </Button>
                </Stack>

                {/* Questions Cards */}
                {quizForm.questions.map((q, idx) => (
                  <Card key={idx} variant="outlined" sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'visible' }}>
                    {/* Question Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Q{idx + 1}</Typography>
                        <Chip label={q.question_type.toUpperCase()} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" disabled={idx === 0} onClick={() => handleMoveQuestion(idx, 'up')}>
                          <BsArrowUp size={14} />
                        </IconButton>
                        <IconButton size="small" disabled={idx === quizForm.questions.length - 1} onClick={() => handleMoveQuestion(idx, 'down')}>
                          <BsArrowDown size={14} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleRemoveQuestion(idx)}>
                          <BsTrash size={14} />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Question Form */}
                    <Box sx={{ p: 2.5 }}>
                      <Stack spacing={2}>
                        <TextField 
                          label="Question Text" 
                          fullWidth 
                          multiline 
                          rows={2} 
                          value={q.question_text} 
                          onChange={e => handleUpdateQuestion(idx, { question_text: e.target.value })} 
                        />

                        <TextField
                          select
                          label="Question Type"
                          fullWidth
                          size="small"
                          value={q.question_type}
                          onChange={e => handleUpdateQuestion(idx, { question_type: e.target.value })}
                        >
                          <MenuItem value="mcq">Single Choice (MCQ)</MenuItem>
                          <MenuItem value="multiple_select">Multiple Select</MenuItem>
                          <MenuItem value="fill_in_the_blanks">Fill in the Blanks</MenuItem>
                        </TextField>

                        {/* Format: MCQ or Multi-select */}
                        {(q.question_type === 'mcq' || q.question_type === 'multiple_select') && q.options && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                              Options (Check correct answer(s))
                            </Typography>
                            <Stack spacing={1.5}>
                              {[0, 1, 2, 3].map((optIdx) => {
                                const isChecked = q.correct_answers.includes(optIdx);
                                return (
                                  <Stack key={optIdx} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <input 
                                      type={q.question_type === 'mcq' ? 'radio' : 'checkbox'} 
                                      name={`q-${idx}-correct`} 
                                      checked={isChecked}
                                      onChange={() => {
                                        if (q.question_type === 'mcq') {
                                          handleUpdateQuestion(idx, { correct_answers: [optIdx] });
                                        } else {
                                          const prevAnswers = [...q.correct_answers];
                                          if (isChecked) {
                                            handleUpdateQuestion(idx, { correct_answers: prevAnswers.filter(a => a !== optIdx) });
                                          } else {
                                            handleUpdateQuestion(idx, { correct_answers: [...prevAnswers, optIdx] });
                                          }
                                        }
                                      }}
                                    />
                                    <TextField 
                                      placeholder={`Option ${optIdx + 1}`} 
                                      size="small" 
                                      fullWidth 
                                      value={q.options[optIdx] || ''} 
                                      onChange={e => {
                                        const newOpts = [...q.options];
                                        newOpts[optIdx] = e.target.value;
                                        handleUpdateQuestion(idx, { options: newOpts });
                                      }}
                                    />
                                  </Stack>
                                );
                              })}
                            </Stack>
                          </Box>
                        )}

                        {/* Format: Fill in the Blanks */}
                        {q.question_type === 'fill_in_the_blanks' && (
                          <TextField 
                            label="Correct Answer(s)" 
                            helperText="If there are multiple acceptable answers, separate them with commas (e.g. IGST, Integrated GST)" 
                            fullWidth 
                            value={Array.isArray(q.correct_answers) ? q.correct_answers.join(', ') : ''} 
                            onChange={e => {
                              const ansList = e.target.value.split(',').map(s => s.trim());
                              handleUpdateQuestion(idx, { correct_answers: ansList });
                            }}
                          />
                        )}

                        <TextField 
                          label="Explanation / Hint" 
                          fullWidth 
                          placeholder="Explain why this answer is correct..."
                          value={q.explanation || ''} 
                          onChange={e => handleUpdateQuestion(idx, { explanation: e.target.value })} 
                        />
                      </Stack>
                    </Box>
                  </Card>
                ))}

                {quizForm.questions.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center', border: '2px dashed rgba(0,0,0,0.1)', borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No questions added yet. Use the AI Question Generator on the left or click "Add Question Manually" to begin.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, px: 3 }}>
          <Button onClick={() => setQuizModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuiz} variant="contained" disabled={saving} sx={{ px: 4, fontWeight: 700 }}>
            {selectedQuiz ? 'Update Quiz' : 'Save Quiz Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Attempt Stats Dialog */}
      <Dialog open={statsModalOpen} onClose={() => setStatsModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', px: 3, py: 2 }}>
          Completions: {quizStats?.title}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Completed At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizStats?.attempts?.map((a) => {
                  const percent = Math.round((a.score / a.total_questions) * 100) || 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{a.student_name}</TableCell>
                      <TableCell>{a.student_email}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: percent >= 50 ? 'success.main' : 'error.main' }}>
                        {a.score} / {a.total_questions}
                      </TableCell>
                      <TableCell>{percent}%</TableCell>
                      <TableCell>{new Date(a.completed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
                {(!quizStats?.attempts || quizStats.attempts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No students have submitted answers for this quiz yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatsModalOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

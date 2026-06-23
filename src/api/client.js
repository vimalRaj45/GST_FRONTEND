import axios from 'axios';
import offlineClient from './offlineClient.js';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gst-backend-me8o.onrender.com';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s to handle Render cold starts + AI calls
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error normalisation
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Network error';
    const status = err.response?.status || 0;
    const error = new Error(message);
    error.status = status;
    error.data = err.response?.data;
    return Promise.reject(error);
  }
);

// Offline detection helper (Offline mode disabled as requested)
export const isOfflineMode = () => {
  return false;
};

// ── Tax & HSN ──────────────────────────────────────────────
export const getTaxSlabs = () => 
  isOfflineMode() ? offlineClient.getTaxSlabs() : client.get('/api/tax-slabs');

export const getHsnCodes = (search = '') => 
  isOfflineMode() ? offlineClient.getHsnCodes(search) : client.get(`/api/hsn-codes?search=${encodeURIComponent(search)}`);

// ── Calculator ────────────────────────────────────────────
export const calculateGST = (data) => 
  isOfflineMode() ? offlineClient.calculateGST(data) : client.post('/api/calculate-gst', data);

// ── Businesses ────────────────────────────────────────────

// --- Admin Endpoints ---
export const getAdminStats = () => 
  isOfflineMode() ? Promise.resolve({ students: 1, businesses: 1, totalInvoices: 2, totalTaxCollected: 40000 }) : client.get('/api/admin/stats');

export const getStudents = () => 
  isOfflineMode() ? Promise.resolve([]) : client.get('/api/admin/students');

export const getAllBusinesses = () => 
  isOfflineMode() ? Promise.resolve([]) : client.get('/api/admin/businesses');

export const createBusinessForStudent = (data) => {
  if (isOfflineMode()) throw new Error('Adding business templates is unavailable in offline sandbox mode.');
  return client.post('/api/admin/businesses', data);
};

export const approveStudent = (id) => {
  if (isOfflineMode()) throw new Error('Student approval is unavailable in offline sandbox mode.');
  return client.post(`/api/admin/students/${id}/approve`);
};

export const deleteStudent = (id) => {
  if (isOfflineMode()) throw new Error('Deleting students is unavailable in offline sandbox mode.');
  return client.delete(`/api/admin/students/${id}`);
};

export const getAdminTaxSlabs = () => 
  isOfflineMode() ? offlineClient.getTaxSlabs() : client.get('/api/admin/tax-slabs');

export const createTaxSlab = (data) => {
  if (isOfflineMode()) throw new Error('Managing tax slabs is unavailable in offline sandbox mode.');
  return client.post('/api/admin/tax-slabs', data);
};

export const updateTaxSlab = (id, data) => {
  if (isOfflineMode()) throw new Error('Managing tax slabs is unavailable in offline sandbox mode.');
  return client.put(`/api/admin/tax-slabs/${id}`, data);
};

export const deleteTaxSlab = (id) => {
  if (isOfflineMode()) throw new Error('Managing tax slabs is unavailable in offline sandbox mode.');
  return client.delete(`/api/admin/tax-slabs/${id}`);
};

export const getAdminHsnCodes = (search = '') => 
  isOfflineMode() ? offlineClient.getHsnCodes(search) : client.get(`/api/admin/hsn-codes?search=${encodeURIComponent(search)}`);

export const createHsnCode = (data) => {
  if (isOfflineMode()) throw new Error('Managing HSN codes is unavailable in offline sandbox mode.');
  return client.post('/api/admin/hsn-codes', data);
};

export const updateHsnCode = (id, data) => {
  if (isOfflineMode()) throw new Error('Managing HSN codes is unavailable in offline sandbox mode.');
  return client.put(`/api/admin/hsn-codes/${id}`, data);
};

export const deleteHsnCode = (id) => {
  if (isOfflineMode()) throw new Error('Managing HSN codes is unavailable in offline sandbox mode.');
  return client.delete(`/api/admin/hsn-codes/${id}`);
};

// --- Super Admin Endpoints ---
export const getClients = () => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.get('/api/superadmin/clients');
};

export const generateClientInvite = (data) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.post('/api/superadmin/clients/invite', data);
};

export const getClientInvites = () => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.get('/api/superadmin/clients/invites');
};

export const toggleClientStatus = (id) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.post(`/api/superadmin/clients/${id}/toggle-status`);
};

export const renewClientSubscription = (id, data) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.post(`/api/superadmin/clients/${id}/renew`, data);
};

export const updateClientLimit = (id, data) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.post(`/api/superadmin/clients/${id}/update-limit`, data);
};

export const deleteClient = (id) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.delete(`/api/superadmin/clients/${id}`);
};

export const deleteClientInvite = (id) => {
  if (isOfflineMode()) throw new Error('Super-admin functions are unavailable in offline sandbox mode.');
  return client.delete(`/api/superadmin/clients/invites/${id}`);
};

export const studentLogin = (data) => 
  isOfflineMode() ? offlineClient.studentLogin(data) : client.post('/api/auth/student-login', data);

export const getUnassignedBusinesses = () => 
  isOfflineMode() ? offlineClient.getUnassignedBusinesses() : client.get('/api/businesses/unassigned');

export const claimBusiness = (id) => 
  isOfflineMode() ? offlineClient.claimBusiness(id) : client.post(`/api/businesses/${id}/claim`);

export const createBusiness = (data) => 
  isOfflineMode() ? offlineClient.createBusiness(data) : client.post('/api/businesses', data);

export const getBusiness = (id) => 
  isOfflineMode() ? offlineClient.getBusiness(id) : client.get(`/api/businesses/${id}`);

export const listBusinesses = (sessionId) => 
  isOfflineMode() ? offlineClient.listBusinesses(sessionId) : client.get(`/api/businesses?session_id=${sessionId}&include_npc=true`);

// ── Invoices ──────────────────────────────────────────────
export const createInvoice = (data) => 
  isOfflineMode() ? offlineClient.createInvoice(data) : client.post('/api/invoices', data);

export const getInvoice = (id) => 
  isOfflineMode() ? offlineClient.getInvoice(id) : client.get(`/api/invoices/${id}`);

export const getBusinessInvoices = (bizId, periodId) => 
  isOfflineMode() ? offlineClient.getBusinessInvoices(bizId, periodId) : client.get(`/api/businesses/${bizId}/invoices${periodId ? `?period_id=${periodId}` : ''}`);

// ── ITC Ledger ────────────────────────────────────────────
export const getITCSummary = (bizId, periodId) => 
  isOfflineMode() ? offlineClient.getITCSummary(bizId, periodId) : client.get(`/api/businesses/${bizId}/itc-summary?periodId=${periodId}`);

// ── Periods ───────────────────────────────────────────────
export const getPeriods = (bizId) => 
  isOfflineMode() ? offlineClient.getPeriods(bizId) : client.get(`/api/businesses/${bizId}/periods`);

export const closePeriod = (periodId, businessId) => 
  isOfflineMode() ? offlineClient.closePeriod(periodId, businessId) : client.post(`/api/periods/${periodId}/close`, { business_id: businessId });

export const filePeriod = (periodId, businessId) => 
  isOfflineMode() ? offlineClient.filePeriod(periodId, businessId) : client.post(`/api/periods/${periodId}/file`, { business_id: businessId });

export const getFilingPreview = (periodId, businessId) => 
  isOfflineMode() ? offlineClient.getFilingPreview(periodId, businessId) : client.get(`/api/periods/${periodId}/filing-preview?business_id=${businessId}`);

// ── AI ────────────────────────────────────────────────────
export const explainITCStatus = (ledgerEntryId) => 
  isOfflineMode() ? offlineClient.explainITCStatus(ledgerEntryId) : client.post('/api/ai/explain-itc-status', { ledgerEntryId });

export const generateQuizQuestion = (topic) => 
  isOfflineMode() ? offlineClient.generateQuizQuestion(topic) : client.post('/api/ai/quiz-question', { topic });

export const tutorChat = (data) => 
  isOfflineMode() ? offlineClient.tutorChat(data) : client.post('/api/ai/tutor-chat', data);

export const saveQuizAttempt = (data) => 
  isOfflineMode() ? offlineClient.saveQuizAttempt(data) : client.post('/api/ai/quiz-attempts', data);

// ── Products (Inventory) ──────────────────────────────────
export const getProducts = (bizId) => 
  isOfflineMode() ? Promise.resolve([]) : client.get(`/api/products?business_id=${bizId}`);

export const createProduct = (data) => {
  if (isOfflineMode()) throw new Error('Inventory actions are unavailable offline.');
  return client.post('/api/products', data);
};

export const updateProductStock = (id, stock_qty) => {
  if (isOfflineMode()) throw new Error('Inventory actions are unavailable offline.');
  return client.put(`/api/products/${id}/stock`, { stock_qty });
};

export const deleteProduct = (id) => {
  if (isOfflineMode()) throw new Error('Inventory actions are unavailable offline.');
  return client.delete(`/api/products/${id}`);
};


// ── Custom Quizzes ─────────────────────────────────────────

// Admin endpoints
export const generateCustomQuizQuestion = (topic, questionType) => {
  if (isOfflineMode()) throw new Error('Generating custom quiz questions is unavailable offline.');
  return client.post('/api/admin/quizzes/generate-question', { topic, questionType });
};

export const createCustomQuiz = (data) => {
  if (isOfflineMode()) throw new Error('Creating custom quizzes is unavailable offline.');
  return client.post('/api/admin/quizzes', data);
};

export const getCustomQuizzes = () => 
  isOfflineMode() ? Promise.resolve([]) : client.get('/api/admin/quizzes');

export const getCustomQuizDetails = (id) => {
  if (isOfflineMode()) throw new Error('Custom quiz details are unavailable offline.');
  return client.get(`/api/admin/quizzes/${id}`);
};

export const updateCustomQuiz = (id, data) => {
  if (isOfflineMode()) throw new Error('Updating custom quizzes is unavailable offline.');
  return client.put(`/api/admin/quizzes/${id}`, data);
};

export const approveCustomQuiz = (id) => {
  if (isOfflineMode()) throw new Error('Approving custom quizzes is unavailable offline.');
  return client.post(`/api/admin/quizzes/${id}/approve`);
};

export const deleteCustomQuiz = (id) => {
  if (isOfflineMode()) throw new Error('Deleting custom quizzes is unavailable offline.');
  return client.delete(`/api/admin/quizzes/${id}`);
};

// Student endpoints
export const getStudentQuizzes = () => 
  isOfflineMode() ? offlineClient.getStudentQuizzes() : client.get('/api/quizzes');

export const getStudentQuizDetails = (id) => 
  isOfflineMode() ? offlineClient.getStudentQuizDetails(id) : client.get(`/api/quizzes/${id}`);

export const submitStudentQuiz = (id, answers) => 
  isOfflineMode() ? offlineClient.submitStudentQuiz(id, answers) : client.post(`/api/quizzes/${id}/submit`, { answers });

// Export the default customClient with wrapper methods
const customClient = {
  get: async (url, config) => {
    if (isOfflineMode()) {
      if (url === '/api/auth/me') {
        return offlineClient.getCurrentUser();
      }
      throw new Error(`Offline Sandbox: GET ${url} is not supported.`);
    }
    return client.get(url, config);
  },
  post: async (url, data, config) => {
    if (isOfflineMode()) {
      if (url === '/api/auth/login' || url === '/api/auth/student-login') {
        return offlineClient.studentLogin(data);
      }
      if (url === '/api/auth/register') {
        return offlineClient.studentLogin({ email: data.email });
      }
      throw new Error(`Offline Sandbox: POST ${url} is not supported.`);
    }
    return client.post(url, data, config);
  },
  delete: async (url, config) => {
    if (isOfflineMode()) {
      throw new Error(`Offline Sandbox: DELETE ${url} is not supported.`);
    }
    return client.delete(url, config);
  },
  put: async (url, data, config) => {
    if (isOfflineMode()) {
      throw new Error(`Offline Sandbox: PUT ${url} is not supported.`);
    }
    return client.put(url, data, config);
  }
};

export default customClient;

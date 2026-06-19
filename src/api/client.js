import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000, // 35s to allow AI calls
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

// ── Tax & HSN ──────────────────────────────────────────────
export const getTaxSlabs = () => client.get('/api/tax-slabs');
export const getHsnCodes = (search = '') => client.get(`/api/hsn-codes?search=${encodeURIComponent(search)}`);

// ── Calculator ────────────────────────────────────────────
export const calculateGST = (data) => client.post('/api/calculate-gst', data);

// ── Businesses ────────────────────────────────────────────
export const createBusiness = (data) => client.post('/api/businesses', data);
export const getBusiness = (id) => client.get(`/api/businesses/${id}`);
export const listBusinesses = (sessionId) =>
  client.get(`/api/businesses?session_id=${sessionId}&include_npc=true`);

// ── Invoices ──────────────────────────────────────────────
export const createInvoice = (data) => client.post('/api/invoices', data);
export const getInvoice = (id) => client.get(`/api/invoices/${id}`);
export const getBusinessInvoices = (bizId, periodId) =>
  client.get(`/api/businesses/${bizId}/invoices${periodId ? `?period_id=${periodId}` : ''}`);

// ── ITC Ledger ────────────────────────────────────────────
export const getITCSummary = (bizId, periodId) =>
  client.get(`/api/businesses/${bizId}/itc-summary?periodId=${periodId}`);

// ── Periods ───────────────────────────────────────────────
export const getPeriods = (bizId) => client.get(`/api/businesses/${bizId}/periods`);
export const closePeriod = (periodId, businessId) =>
  client.post(`/api/periods/${periodId}/close`, { business_id: businessId });
export const filePeriod = (periodId, businessId) =>
  client.post(`/api/periods/${periodId}/file`, { business_id: businessId });
export const getFilingPreview = (periodId, businessId) =>
  client.get(`/api/periods/${periodId}/filing-preview?business_id=${businessId}`);

// ── AI ────────────────────────────────────────────────────
export const explainITCStatus = (ledgerEntryId) =>
  client.post('/api/ai/explain-itc-status', { ledgerEntryId });
export const generateQuizQuestion = (topic) =>
  client.post('/api/ai/quiz-question', { topic });
export const tutorChat = (data) => client.post('/api/ai/tutor-chat', data);
export const saveQuizAttempt = (data) => client.post('/api/ai/quiz-attempts', data);

export default client;

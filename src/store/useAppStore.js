import { create } from 'zustand';

const SESSION_KEY = 'gst_session_id';
const BUSINESS_KEY = 'gst_business_id';

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Math.random fallback for non-secure HTTP contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getOrCreateSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export const useAppStore = create((set, get) => ({
  sessionId: getOrCreateSessionId(),
  business: null,
  businessId: localStorage.getItem(BUSINESS_KEY) || null,
  
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('auth_token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const res = await (await import('../api/client.js')).default.post('/api/auth/login', { email, password });
    get().setToken(res.token);
    get().setUser(res.user);
    if (res.business) {
      get().setBusiness(res.business);
    } else {
      get().clearBusiness();
    }
  },

  studentLogin: async (email, inviteCode) => {
    const res = await (await import('../api/client.js')).studentLogin({ email, inviteCode });
    get().setToken(res.token);
    get().setUser(res.user);
    if (res.business) {
      get().setBusiness(res.business);
    } else {
      get().clearBusiness();
    }
  },

  registerUser: async (name, email, password, admin_code) => {
    const res = await (await import('../api/client.js')).default.post('/api/auth/register', { name, email, password, admin_code });
    get().setToken(res.token);
    get().setUser(res.user);
    get().clearBusiness();
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    const attempt = async (isRetry = false) => {
      try {
        const res = await (await import('../api/client.js')).default.get('/api/auth/me');
        const { business, ...user } = res;
        set({ user, isAuthenticated: true });
        if (business) {
          set({ business, businessId: business.id });
          localStorage.setItem(BUSINESS_KEY, business.id);
        } else {
          set({ business: null, businessId: null });
          localStorage.removeItem(BUSINESS_KEY);
        }
      } catch (err) {
        // Retry once on network errors (e.g. Render cold start)
        if (!isRetry && (!err.status || err.status === 0)) {
          console.warn('Network error on profile load, retrying in 5s...');
          await new Promise((r) => setTimeout(r, 5000));
          return attempt(true);
        }
        console.error('Failed to load user profile:', err);
        if (err.status === 401) {
          get().logout();
        }
      }
    };
    await attempt();
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(BUSINESS_KEY);
    set({ user: null, token: null, isAuthenticated: false, business: null, businessId: null });
  },

  setBusiness: (business) => {
    set({ business, businessId: business?.id || null });
    if (business?.id) {
      localStorage.setItem(BUSINESS_KEY, business.id);
    } else {
      localStorage.removeItem(BUSINESS_KEY);
    }
  },

  clearBusiness: () => {
    set({ business: null, businessId: null });
    localStorage.removeItem(BUSINESS_KEY);
  },

  // Optimistic UI helpers
  optimisticUpdates: {},
  setOptimisticUpdate: (key, value) =>
    set((s) => ({ optimisticUpdates: { ...s.optimisticUpdates, [key]: value } })),
  clearOptimisticUpdate: (key) =>
    set((s) => {
      const upd = { ...s.optimisticUpdates };
      delete upd[key];
      return { optimisticUpdates: upd };
    }),
}));

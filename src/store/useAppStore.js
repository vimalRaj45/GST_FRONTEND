import { create } from 'zustand';

const SESSION_KEY = 'gst_session_id';
const BUSINESS_KEY = 'gst_business_id';

function getOrCreateSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export const useAppStore = create((set, get) => ({
  sessionId: getOrCreateSessionId(),
  business: null,
  businessId: localStorage.getItem(BUSINESS_KEY) || null,

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

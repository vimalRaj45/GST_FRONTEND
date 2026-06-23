import { create } from 'zustand';

export const useGuideStore = create((set, get) => ({
  active: false,
  scenario: null,
  stepIdx: 0,
  stepState: 'idle', // 'idle' | 'checking' | 'pass' | 'fail' | 'done'
  feedback: null,
  completedScenarios: (() => {
    try { return JSON.parse(localStorage.getItem('gst_guide_done') || '[]'); }
    catch { return []; }
  })(),
  guideDrawerOpen: false,
  tutorDrawerOpen: false,
  setGuideDrawerOpen: (open) => set({ guideDrawerOpen: open }),
  setTutorDrawerOpen: (open) => set({ tutorDrawerOpen: open }),

  startScenario: (scenario) => set({
    active: true, scenario, stepIdx: 0,
    stepState: 'idle', feedback: null
  }),

  stopGuide: () => set({
    active: false, scenario: null, stepIdx: 0,
    stepState: 'idle', feedback: null
  }),

  nextStep: () => set(s => ({
    stepIdx: s.stepIdx + 1,
    stepState: 'idle',
    feedback: null
  })),

  setStepState: (stepState, feedback = null) => set({ stepState, feedback }),

  completeScenario: (id) => {
    const done = [...new Set([...get().completedScenarios, id])];
    localStorage.setItem('gst_guide_done', JSON.stringify(done));
    set({ completedScenarios: done, stepState: 'done' });
  },

  resetStep: () => set({ stepState: 'idle', feedback: null }),
}));

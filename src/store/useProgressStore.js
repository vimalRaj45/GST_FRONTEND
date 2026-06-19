import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProgressStore = create(
  persist(
    (set, get) => ({
      // Quiz attempts: { topic, correct, total, date }[]
      quizAttempts: [],

      // Module completion flags
      modules: {
        registeredBusiness: false,
        createdInvoice: false,
        viewedLedger: false,
        closedPeriod: false,
        filedReturn: false,
        usedCalculator: false,
        completedQuiz: false,
        viewedGstr1: false,
        generatedEWayBill: false,
        exploredHsn: false,
      },

      // Add a quiz attempt
      addQuizAttempt: (topic, isCorrect) => {
        set((state) => ({
          quizAttempts: [
            ...state.quizAttempts,
            { topic, correct: isCorrect ? 1 : 0, total: 1, date: new Date().toISOString() },
          ],
          modules: { ...state.modules, completedQuiz: true },
        }));
      },

      // Mark a module as complete
      markModule: (moduleKey) => {
        set((state) => ({
          modules: { ...state.modules, [moduleKey]: true },
        }));
      },

      // Get quiz stats per topic
      getTopicStats: () => {
        const attempts = get().quizAttempts;
        const map = {};
        attempts.forEach(({ topic, correct, total }) => {
          if (!map[topic]) map[topic] = { correct: 0, total: 0 };
          map[topic].correct += correct;
          map[topic].total += total;
        });
        return map;
      },

      // Overall accuracy
      getOverallAccuracy: () => {
        const attempts = get().quizAttempts;
        if (attempts.length === 0) return 0;
        const correct = attempts.reduce((s, a) => s + a.correct, 0);
        const total = attempts.reduce((s, a) => s + a.total, 0);
        return total === 0 ? 0 : Math.round((correct / total) * 100);
      },

      // Overall progress percentage
      getModuleProgress: () => {
        const modules = get().modules;
        const keys = Object.keys(modules);
        const done = keys.filter((k) => modules[k]).length;
        return Math.round((done / keys.length) * 100);
      },

      // Reset all progress
      resetProgress: () => set({ quizAttempts: [], modules: { registeredBusiness: false, createdInvoice: false, viewedLedger: false, closedPeriod: false, filedReturn: false, usedCalculator: false, completedQuiz: false, viewedGstr1: false, generatedEWayBill: false, exploredHsn: false } }),
    }),
    { name: 'gst-simulator-progress' }
  )
);

export default useProgressStore;

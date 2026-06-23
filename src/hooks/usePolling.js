import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling - Calls `fetchFn` immediately and then every `intervalMs` milliseconds.
 * Automatically pauses when the browser tab is hidden and resumes on focus.
 * Cleans up the interval on unmount.
 *
 * @param {Function} fetchFn   - The async function to call (should not change identity; wrap in useCallback)
 * @param {number}   intervalMs - Polling interval in ms (default 30 000 = 30s)
 * @param {boolean}  enabled   - Set to false to pause polling (e.g. when a required ID is missing)
 */
export function usePolling(fetchFn, intervalMs = 30000, enabled = true) {
  const timerRef = useRef(null);
  const fetchRef = useRef(fetchFn);

  // Keep ref in sync so interval always calls the latest fetchFn
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const startPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetchRef.current();
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Initial fetch
    fetchRef.current();
    startPolling();

    // Pause when tab hidden, resume on visibility
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchRef.current(); // fetch immediately on tab focus
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, startPolling, stopPolling]);
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMetric1,
  setMetric1 as apiSetMetric1,
  onSettingsChange,
} from '../lib/supabaseService';

/**
 * Hook that mirrors the old polling + BroadcastChannel behaviour for metric1.
 * Returns the current "NOW SERVING" value and a setter.
 */
export function useMetric1(pollMs = 2000) {
  const [nowServing, setNowServing] = useState<number>(1);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Fetch from Supabase
  const refresh = useCallback(async () => {
    try {
      const { value } = await getMetric1();
      setNowServing(Number(value) || 1);
    } catch (e) {
      console.error('metric1 fetch failed', e);
    }
  }, []);

  // Push to Supabase + broadcast
  const updateMetric = useCallback(
    async (value: number) => {
      const safe = Math.max(1, Math.round(value));
      setNowServing(safe);
      try {
        await apiSetMetric1(safe);
      } catch (e) {
        console.error('metric1 set failed', e);
      }
      bcRef.current?.postMessage({ type: 'metric1', value: safe, ts: Date.now() });
    },
    []
  );

  useEffect(() => {
    // Initial fetch
    refresh();

    // Polling fallback
    const interval = setInterval(refresh, pollMs);

    // BroadcastChannel for instant same-device sync
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('metric-sync');
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'metric1') {
          setNowServing(Number(ev.data.value) || 1);
        }
      };
    }

    // Supabase Realtime subscription
    const unsubscribe = onSettingsChange((row) => {
      if (row.key === 'metric1') {
        setNowServing(Number(row.value) || 1);
      }
    });

    return () => {
      clearInterval(interval);
      bcRef.current?.close();
      unsubscribe();
    };
  }, [refresh, pollMs]);

  return { nowServing, setNowServing: updateMetric, refresh };
}

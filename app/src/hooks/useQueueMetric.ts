import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNowServing,
  setNowServing as apiSetNowServing,
  onQueueChange,
} from '../lib/queueService';

/**
 * Queue-scoped version of useMetric1.
 * Tracks the now_serving value for a specific queue.
 */
export function useQueueMetric(queueId: string | undefined, pollMs = 2000) {
  const [nowServing, setNowServing] = useState<number>(1);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const refresh = useCallback(async () => {
    if (!queueId) return;
    try {
      const value = await getNowServing(queueId);
      setNowServing(value);
    } catch (e) {
      console.error('queue now_serving fetch failed', e);
    }
  }, [queueId]);

  const updateMetric = useCallback(
    async (value: number) => {
      if (!queueId) return;
      const safe = Math.max(1, Math.round(value));
      setNowServing(safe);
      try {
        await apiSetNowServing(queueId, safe);
      } catch (e) {
        console.error('queue now_serving set failed', e);
      }
      bcRef.current?.postMessage({
        type: 'queue:nowServing',
        queueId,
        value: safe,
        ts: Date.now(),
      });
    },
    [queueId]
  );

  useEffect(() => {
    if (!queueId) return;

    refresh();
    const interval = setInterval(refresh, pollMs);

    // BroadcastChannel for same-device sync
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`queue-metric-${queueId}`);
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        if (
          ev?.data?.type === 'queue:nowServing' &&
          ev.data.queueId === queueId
        ) {
          setNowServing(Number(ev.data.value) || 1);
        }
      };
    }

    // Supabase Realtime on the queues row
    const unsubscribe = onQueueChange(queueId, (queue) => {
      setNowServing(queue.now_serving);
    });

    return () => {
      clearInterval(interval);
      bcRef.current?.close();
      unsubscribe();
    };
  }, [queueId, pollMs, refresh]);

  return { nowServing, setNowServing: updateMetric, refresh };
}

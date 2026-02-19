import '@testing-library/jest-dom';

// Mock BroadcastChannel (not available in jsdom)
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(_data: unknown) { /* noop in test */ }
  close() { /* noop */ }
  addEventListener() { /* noop */ }
  removeEventListener() { /* noop */ }
  dispatchEvent() { return true; }
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).BroadcastChannel = MockBroadcastChannel;
}

// Mock import.meta.env — only provide fallbacks so .env values are preserved
if (!(import.meta as Record<string, unknown>).env) {
  (import.meta as Record<string, unknown>).env = {};
}
const env = import.meta.env as Record<string, string>;
if (!env.VITE_SUPABASE_URL) env.VITE_SUPABASE_URL = 'https://test.supabase.co';
if (!env.VITE_SUPABASE_ANON_KEY) env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

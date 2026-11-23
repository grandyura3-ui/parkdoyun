import type { BillDraft, SavedRecord } from '../types.ts';

const DRAFT_STORAGE_KEY = 'mock_legislature_draft_v1';
const RECORDS_STORAGE_KEY = 'mock_legislature_records_v1';
const MAX_RECORDS = 10;

export function saveDraftToStorage(draft: BillDraft): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

export function loadDraftFromStorage(): BillDraft | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BillDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      purpose: typeof parsed.purpose === 'string' ? parsed.purpose : '',
      target: parsed.target ?? '전교생',
      sanction: typeof parsed.sanction === 'string' ? parsed.sanction : '',
    };
  } catch {
    return null;
  }
}

export function clearDraftFromStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadSavedRecords(): SavedRecord[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveRecordToStorage(record: SavedRecord): SavedRecord[] {
  const current = loadSavedRecords().filter((r) => r.id !== record.id);
  const next = [record, ...current].slice(0, MAX_RECORDS);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function deleteRecordFromStorage(id: string): SavedRecord[] {
  const next = loadSavedRecords().filter((r) => r.id !== id);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function clearAllRecordsFromStorage(): SavedRecord[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(RECORDS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

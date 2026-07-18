import { useEffect, useRef, useState } from 'react'
import { sessionApi } from '../api/session.api'
import type { CodeSnapshot } from '../types'

interface CodingHistoryOptions {
  sessionId: number
  code: string
  language: string
  enabled: boolean
  autoSave: boolean
}

export function useCodingHistory({ sessionId, code, language, enabled, autoSave }: CodingHistoryOptions) {
  const [editCount, setEditCount] = useState(0);

  const startedAtRef = useRef(new Date().toISOString());
  const snapshotsRef = useRef<CodeSnapshot[]>([]);
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const editCountRef = useRef(0);
  const firstRunRef = useRef(true);

  const autoSaveKey = `ss_autosave_${sessionId}`;

  // Keep latest code/language in refs so intervals/unmount always see current values
  useEffect(() => {
    codeRef.current = code;
    languageRef.current = language;
  }, [code, language]);

  // Track edit count — increment on every code change (skip the initial mount)
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    if (!enabled) return;
    editCountRef.current += 1;
    setEditCount(editCountRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Save a code snapshot every 60 seconds
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      snapshotsRef.current = [
        ...snapshotsRef.current,
        { code: codeRef.current, timestamp: new Date().toISOString(), language: languageRef.current },
      ];
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Auto-save code to localStorage every 30 seconds
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      localStorage.setItem(autoSaveKey, codeRef.current);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, autoSaveKey]);

  // On unmount — persist edit count + snapshots to the backend
  useEffect(() => {
    return () => {
      if (!enabled) return;
      sessionApi
        .saveCodingHistory(sessionId, {
          editCount: editCountRef.current,
          startedAt: startedAtRef.current,
          snapshots: snapshotsRef.current,
        })
        .catch(() => {
          /* best-effort — history recording should never block navigation */
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]);

  function getAutoSaved(): string | null {
    return localStorage.getItem(autoSaveKey);
  }

  return { editCount, getAutoSaved };
}

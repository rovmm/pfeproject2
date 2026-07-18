import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AiRestrictionContextValue = {
  aiRestricted: boolean;
  returnPath: string | null;
  setAiRestricted: (restricted: boolean, returnPath?: string) => void;
};

const AiRestrictionContext = createContext<AiRestrictionContextValue | null>(null);

export function AiRestrictionProvider({ children }: { children: ReactNode }) {
  const [aiRestricted, setRestricted] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);

  const setAiRestricted = (restricted: boolean, path?: string) => {
    setRestricted(restricted);
    setReturnPath(restricted ? path ?? null : null);
  };

  const value = useMemo<AiRestrictionContextValue>(
    () => ({ aiRestricted, returnPath, setAiRestricted }),
    [aiRestricted, returnPath],
  );

  return <AiRestrictionContext.Provider value={value}>{children}</AiRestrictionContext.Provider>;
}

export function useAiRestriction() {
  const ctx = useContext(AiRestrictionContext);
  if (!ctx) throw new Error('useAiRestriction must be used within AiRestrictionProvider');
  return ctx;
}

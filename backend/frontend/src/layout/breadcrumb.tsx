import { createContext, useContext, useEffect } from 'react';

type BreadcrumbContextValue = {
  setSegments: (segments: string[]) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function useBreadcrumb(segments: string[]) {
  const ctx = useContext(BreadcrumbContext);
  useEffect(() => {
    ctx?.setSegments(segments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join('/')]);
}

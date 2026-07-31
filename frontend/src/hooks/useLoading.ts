import { useState } from 'react';

export function useLoading() {
  const [loading, setLoading] = useState(false);

  return {
    loading,
    startLoading: () => setLoading(true),
    stopLoading: () => setLoading(false),
  };
}

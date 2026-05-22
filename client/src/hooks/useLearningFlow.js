import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useLearningFlow(unitId) {
  const [phase, setPhase] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    api.get(`/learning/progress/unit/${unitId}`)
      .then((data) => setPhase(data.currentPhase || 0))
      .catch(() => setPhase(0))
      .finally(() => setLoading(false));
  }, [unitId]);

  async function completePhase(phaseNum) {
    await api.post(`/learning/progress/unit/${unitId}/phase/${phaseNum}/complete`);
    setPhase(phaseNum);
  }

  return { phase, loading, completePhase };
}

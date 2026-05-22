import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export function useProgress(chapterId) {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (!chapterId) return;
    api.get(`/progress/chapter/${chapterId}`)
      .then((data) => {
        const map = {};
        data.forEach((item) => { map[item.unitId] = item.currentPhase; });
        setProgress(map);
      })
      .catch(() => {});
  }, [chapterId]);

  return progress;
}

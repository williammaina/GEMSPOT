import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * /plan is merged into My list (Saved hub).
 * Keep this route for old links and the floating plan bar.
 */
export function PlanSharePage() {
  useEffect(() => {
    // no-op — immediate redirect
  }, []);
  return <Navigate to="/saved?tab=plan" replace />;
}

'use client';

import React from 'react';

// RABillingGenerator has been deprecated.
// Money & billing tracking is handled externally per user directive.
export const RABillingGenerator: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
      <h3 className="text-white font-bold">Billing Module Removed</h3>
      <p className="text-xs text-slate-400">Money tracking is handled by your accounting team. This module is no longer active.</p>
    </div>
  );
};

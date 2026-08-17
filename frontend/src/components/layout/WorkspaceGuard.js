import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const WorkspaceGuard = ({
  requiredPermission,
  userPermissions = [],
  userRole = 'site_engineer',
  children,
  fallback
}) => {
  // Admins and developers have universal access
  if (userRole === 'admin' || userRole === 'developer') {
    return <>{children}</>;
  }

  const hasAccess = userPermissions.includes(requiredPermission) || userPermissions.includes('all');

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-xl">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">Access Restricted</h3>
      <p className="mt-2 max-w-md text-xs text-slate-400">
        Your active role (<span className="font-semibold text-amber-400">{userRole.toUpperCase()}</span>) does not have authorization to view the <span className="font-semibold text-white">{requiredPermission.toUpperCase()}</span> workspace.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Please contact your site administrator to adjust your role workspace permissions in local PostgreSQL.
      </p>
    </div>
  );
};

export default WorkspaceGuard;

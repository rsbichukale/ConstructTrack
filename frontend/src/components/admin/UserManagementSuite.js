'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Building, 
  HardHat, 
  Phone, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  RefreshCw,
  KeyRound,
  Shield,
  Briefcase
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { 
  fetchUsersFromBackend, 
  fetchRolesFromBackend,
  createUserInBackend, 
  updateUserInBackend, 
  deleteUserInBackend,
  resendInviteInBackend,
  requestPasswordResetInBackend
} from '../../lib/backendSync';

export const UserManagementSuite = () => {
  const state = getAppState();
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // New User Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('site_engineer');
  const [formContractorId, setFormContractorId] = useState('');
  const [formSendInvite, setFormSendInvite] = useState(true);
  const [formDirectPassword, setFormDirectPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Role Form
  const [editRole, setEditRole] = useState('site_engineer');
  const [editContractorId, setEditContractorId] = useState('');

  // Reset Password Form
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    const [users, roles] = await Promise.all([
      fetchUsersFromBackend(),
      fetchRolesFromBackend()
    ]);
    setUsersList(users);
    setRolesList(roles);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      alert('Email is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        email: formEmail.trim().toLowerCase(),
        name: formName.trim() || formEmail.split('@')[0],
        role: formRole,
        phone: formPhone.trim() || null,
        contractorId: formRole === 'contractor' && formContractorId ? Number(formContractorId) : null,
        sendEmailInvite: formSendInvite,
        password: formDirectPassword.trim() || undefined
      };

      const res = await createUserInBackend(payload);
      setFeedbackMsg(res.message || `Account for '${formEmail}' provisioned via Local Database!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsNewUserModalOpen(false);

      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormDirectPassword('');
      setFormRole('site_engineer');
      setFormContractorId('');
      setFormSendInvite(true);

      await loadUsers();
    } catch (err) {
      alert('Error creating user: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (user) => {
    try {
      await resendInviteInBackend(user.email);
      setFeedbackMsg(`Local Database invitation email re-sent to ${user.email}!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      alert('Error resending invite: ' + err.message);
    }
  };

  const handleSendResetEmail = async (user) => {
    try {
      await requestPasswordResetInBackend(user.email);
      setFeedbackMsg(`Local Database password recovery email dispatched to ${user.email}!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      alert('Error sending recovery email: ' + err.message);
    }
  };

  const handleOpenEditRole = (user) => {
    setSelectedUser(user);
    setEditRole(user.role || 'site_engineer');
    setEditContractorId(user.contractorId || '');
    setIsEditRoleModalOpen(true);
  };

  const handleSaveEditRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await updateUserInBackend(selectedUser.id, {
        role: editRole,
        contractorId: editRole === 'contractor' && editContractorId ? Number(editContractorId) : null
      });
      const roleLabel = rolesList.find(role => role.code === editRole)?.name || editRole;
      setFeedbackMsg(`Role permissions for '${selectedUser.email}' updated to '${roleLabel}'.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsEditRoleModalOpen(false);
      await loadUsers();
    } catch (err) {
      alert('Error updating role: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordVal('');
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal.trim()) {
      alert('Please enter a new password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateUserInBackend(selectedUser.id, { password: resetPasswordVal.trim() });
      setFeedbackMsg(`Password for '${selectedUser.email}' reset successfully in Local Database.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsResetPasswordModalOpen(false);
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to revoke access and delete user account '${user.email}' from Local Database?`)) {
      return;
    }
    try {
      await deleteUserInBackend(user.id);
      setFeedbackMsg(`User '${user.email}' removed from Local Database.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      await loadUsers();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  // KPIs
  const totalUsers = usersList.length;
  const siteEngineersCount = usersList.filter(u => u.role === 'site_engineer' || u.role === 'supervisor').length;
  const billingSalesCount = usersList.filter(u => u.role === 'billing' || u.role === 'sales').length;
  const contractorsCount = usersList.filter(u => u.role === 'contractor').length;

  const filteredUsers = usersList.filter(u => {
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;
    const query = searchQuery.toLowerCase();
    const searchMatch = !query || 
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query));
    return roleMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin-Only Provisioning & Local Database Auth</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Staff & User Management Directory
          </h2>
          <p className="text-xs text-slate-400">
            Invite project personnel via Local Database email delivery, assign RBAC roles, and manage permissions.
          </p>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Team</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalUsers} Users</div>
          <div className="text-[11px] text-slate-400">Managed in Local Database Auth</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Engineers</span>
            <HardHat className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300">{siteEngineersCount} Engineers</div>
          <div className="text-[11px] text-slate-400">Execution & Room Checklists</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commercial / Sales</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{billingSalesCount} Officers</div>
          <div className="text-[11px] text-slate-400">Billing & Variations</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trade Contractors</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{contractorsCount} Contractors</div>
          <div className="text-[11px] text-slate-400">Task Portal Logins</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-bold no-scrollbar">
          <span className="text-slate-500 mr-2 text-[11px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </span>
          {[{ code: 'ALL', name: 'All Roles' }, ...rolesList].map(role => (
            <button
              key={role.code}
              onClick={() => setRoleFilter(role.code)}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer ${
                roleFilter === role.code
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">Loading users from Local Database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-2">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Users Found</h3>
          <p className="text-xs text-slate-400">Click "Invite Team Member" above to add staff via Local Database Auth email.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const roleCfg = rolesList.find(role => role.code === user.role) || {
              name: user.role,
              description: null
            };

            return (
              <div 
                key={user.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-xs">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-sm truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{user.email}</div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 bg-slate-950 text-amber-300 border-slate-700">
                      {roleCfg.name}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-slate-300">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-400">{roleCfg.description || roleCfg.name}</span>
                    </div>

                    {/* Email Verification Status */}
                    <div className="pt-1 flex items-center space-x-1.5">
                      {user.isEmailVerified ? (
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-extrabold rounded-md flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Verified & Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-extrabold rounded-md flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-amber-400" />
                          <span>Invite Dispatched</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleResendInvite(user)}
                      title="Resend Local Database Invitation Email"
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSendResetEmail(user)}
                      title="Dispatch Local Database Password Reset Email"
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditRole(user)}
                      title="Edit Role & Permissions"
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      title="Revoke Access & Delete"
                      className="p-2 bg-rose-950/30 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal: Invite New Team Member (Local Database Auth Email Delivery) */}
      {isNewUserModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsNewUserModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-300">Staff Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Vikram Patil"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98220..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Assigned Role & Access Scope *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {rolesList.map(role => (
                    <option key={role.code} value={role.code}>{role.name}</option>
                  ))}
                </select>
              </div>

              {formRole === 'contractor' && (
                <div className="space-y-1 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="text-amber-400">Map to Sub-Contractor Entity</label>
                  <select
                    value={formContractorId}
                    onChange={(e) => setFormContractorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Contractor Entity...</option>
                    {(state.contractors || []).map(c => (
                      <option key={c.id} value={c.id}>{c.companyName || c.company_name} ({c.tradeType || c.trade_type})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email Delivery Options */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSendInvite}
                    onChange={(e) => setFormSendInvite(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span>Dispatch Local Database Invitation Email (User sets their password)</span>
                </label>

                {!formSendInvite && (
                  <div className="pt-2 space-y-1 border-t border-slate-800/80 animate-in fade-in">
                    <label className="text-slate-400">Set Initial Temporary Password</label>
                    <input
                      type="text"
                      placeholder="Minimum 8 characters..."
                      value={formDirectPassword}
                      onChange={(e) => setFormDirectPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl hover:scale-105 transition shadow-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Provisioning...' : 'Provision User via Local Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Role & Access Scope */}
      {isEditRoleModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsEditRoleModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Edit Role Permissions</h3>
              </div>
              <button
                onClick={() => setIsEditRoleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRole} className="space-y-4 text-xs font-bold">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-white font-extrabold">{selectedUser.name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedUser.email}</div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Select New Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {rolesList.map(role => (
                    <option key={role.code} value={role.code}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl hover:scale-105 transition shadow-lg cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Role Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

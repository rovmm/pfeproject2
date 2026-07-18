import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBreadcrumb } from '../layout/breadcrumb';
import { AVATAR_UPDATED_EVENT } from '../layout/AppShell';
import Icon from '../components/Icon';
import Badge, { type BadgeKind } from '../components/Badge';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { authApi } from '../api/auth.api';
import type { UserResponse } from '../types';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function avatarKey(userId: number) {
  return `ss_avatar_${userId}`;
}

function planBadgeKind(plan: string | undefined): BadgeKind {
  return plan === 'FREE' || !plan ? 'free' : 'premium';
}

function formatMemberSince(iso: string | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Profile() {
  useBreadcrumb(['Profile']);
  const { user, updateUser } = useAuth();
  const pushToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAvatarUrl(localStorage.getItem(avatarKey(user.id)));
    authApi
      .getMe()
      .then((res) => {
        setProfile(res);
        setFullName(res.fullName);
      })
      .catch(() => {
        setProfile(null);
        setFullName(user.name);
      });
  }, [user?.id]);

  if (!user) return null;

  function handleAvatarSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      pushToast('error', 'Only .jpg, .jpeg, .png or .webp images are allowed.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      pushToast('error', 'Image must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPendingAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function saveAvatar() {
    if (!pendingAvatar || !user) return;
    localStorage.setItem(avatarKey(user.id), pendingAvatar);
    setAvatarUrl(pendingAvatar);
    setPendingAvatar(null);
    window.dispatchEvent(new Event(AVATAR_UPDATED_EVENT));
    pushToast('success', 'Profile photo updated.');
  }

  async function handleSaveProfile() {
    const trimmed = fullName.trim();
    if (!trimmed) {
      pushToast('error', 'Full name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authApi.updateMe({ fullName: trimmed });
      setProfile(res);
      updateUser({
        name: res.fullName,
        initials: res.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      });
      pushToast('success', 'Profile updated.');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword) {
      pushToast('error', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      pushToast('error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      pushToast('error', 'Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updateMe({ currentPassword, newPassword });
      pushToast('success', 'Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  const displayedAvatar = pendingAvatar || avatarUrl;
  const displayName = profile?.fullName || user.name;
  const displayEmail = profile?.email || user.email;

  return (
    <div style={{ padding: '28px 34px', maxWidth: 720, margin: '0 auto' }}>
      {/* Avatar card */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 16 }}>
          {displayedAvatar ? (
            <img
              src={displayedAvatar}
              alt={displayName}
              className="avatar"
              style={{ width: 96, height: 96, objectFit: 'cover', fontSize: 28 }}
            />
          ) : (
            <div className="avatar" style={{ width: 96, height: 96, fontSize: 28 }}>
              {user.initials}
            </div>
          )}
          <button
            onClick={() => fileInput.current?.click()}
            title="Change photo"
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid var(--surface)',
              background: 'var(--navy)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="camera" size={15} />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarSelect}
            style={{ display: 'none' }}
          />
        </div>

        {pendingAvatar && (
          <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={saveAvatar}>
            Save
          </button>
        )}

        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Badge kind={user.role}>{user.role.toUpperCase()}</Badge>
          <Badge kind={planBadgeKind(profile?.plan)}>{(profile?.plan || 'FREE').toUpperCase()}</Badge>
        </div>
        {profile?.createdAt && (
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Member since {formatMemberSince(profile.createdAt)}</div>
        )}
      </div>

      {/* Edit profile */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>
          Edit Profile
        </div>

        <label className="field-label">Full name</label>
        <input
          className="input"
          style={{ marginBottom: 16 }}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="field-label">Email</label>
        <input className="input input-disabled" style={{ marginBottom: 6 }} value={displayEmail} disabled />
        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 16 }}>Email cannot be changed</div>

        <button className="btn btn-primary btn-md" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="card card-pad">
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>
          Change Password
        </div>

        <label className="field-label">Current password</label>
        <div className="input-row" style={{ marginBottom: 14 }}>
          <span className="input-row-icon">
            <Icon name="lock" size={16} />
          </span>
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <span className="input-row-icon" style={{ cursor: 'pointer' }} onClick={() => setShowCurrent((s) => !s)}>
            <Icon name={showCurrent ? 'eye-off' : 'eye'} size={16} />
          </span>
        </div>

        <label className="field-label">New password</label>
        <div className="input-row" style={{ marginBottom: 14 }}>
          <span className="input-row-icon">
            <Icon name="lock" size={16} />
          </span>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <span className="input-row-icon" style={{ cursor: 'pointer' }} onClick={() => setShowNew((s) => !s)}>
            <Icon name={showNew ? 'eye-off' : 'eye'} size={16} />
          </span>
        </div>

        <label className="field-label">Confirm new password</label>
        <div className="input-row" style={{ marginBottom: 20 }}>
          <span className="input-row-icon">
            <Icon name="lock" size={16} />
          </span>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <span className="input-row-icon" style={{ cursor: 'pointer' }} onClick={() => setShowConfirm((s) => !s)}>
            <Icon name={showConfirm ? 'eye-off' : 'eye'} size={16} />
          </span>
        </div>

        <button className="btn btn-primary btn-md" onClick={handleUpdatePassword} disabled={savingPassword}>
          {savingPassword ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

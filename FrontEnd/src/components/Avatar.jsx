import { useEffect, useState } from 'react';
import { apiBlob } from '../api/client';
import { initialsFromProfile } from '../utils/format';

const avatarColors = {
  A: 'var(--color-chart-1)',
  B: 'var(--color-chart-2)',
  C: 'var(--color-chart-3)',
  D: 'var(--color-chart-4)',
  E: 'var(--color-chart-10)',
  F: 'var(--color-chart-5)',
  G: 'var(--color-chart-6)',
  H: 'var(--color-chart-9)',
  I: 'var(--color-chart-1)',
  J: 'var(--color-chart-2)',
  K: 'var(--color-chart-3)',
  L: 'var(--color-chart-4)',
  M: 'var(--color-chart-10)',
  N: 'var(--color-chart-5)',
  Ñ: 'var(--color-chart-6)',
  O: 'var(--color-chart-9)',
  P: 'var(--color-chart-1)',
  Q: 'var(--color-chart-2)',
  R: 'var(--color-chart-3)',
  S: 'var(--color-chart-4)',
  T: 'var(--color-chart-10)',
  U: 'var(--color-chart-5)',
  V: 'var(--color-chart-6)',
  W: 'var(--color-chart-9)',
  X: 'var(--color-chart-1)',
  Y: 'var(--color-chart-2)',
  Z: 'var(--color-chart-3)',
};

function avatarColorFromInitials(initials) {
  const letter = initials
    ?.trim()
    .charAt(0)
    .toUpperCase();

  return avatarColors[letter] || 'var(--color-primary)';
}

export function Avatar({ profile, token, size = 'md', className = '' }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    setSource('');
    setFailed(false);

    if (!profile?.id || !profile?.profileImageUrl || !token) {
      return undefined;
    }

    apiBlob(profile.profileImageUrl, token)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setSource(objectUrl);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [profile?.id, profile?.profileImageUrl, profile?.updatedAt, token]);

  const sizes = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-24 w-24 text-3xl',
  };
  const initials = initialsFromProfile(profile);
  const fallbackColor = avatarColorFromInitials(initials);

  if (source && !failed) {
    return (
      <img
        alt={profile?.username || 'Usuario'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-panel dark:ring-surface-soft ${className}`}
        onError={() => setFailed(true)}
        src={source}
      />
    );
  }


  return (
    <div
      className={`${sizes[size]} grid place-items-center rounded-full font-semibold text-inverse ring-2 ring-panel shadow-card dark:ring-surface-soft ${className}`}
      style={{ backgroundColor: fallbackColor }}
    >
      {initials}
    </div>
  );
}

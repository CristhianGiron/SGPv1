import { useEffect, useState } from 'react';
import { apiBlob } from '../api/client';
import { initialsFromProfile } from '../utils/format';

const avatarColors = {
  A: '#9f2933',
  B: '#ad852d',
  C: '#04344c',
  D: '#529914',
  E: '#7d1f28',
  F: '#074462',
  G: '#3f760f',
  H: '#8a6a20',
  I: '#9f2933',
  J: '#ad852d',
  K: '#04344c',
  L: '#529914',
  M: '#7d1f28',
  N: '#074462',
  Ñ: '#3f760f',
  O: '#8a6a20',
  P: '#9f2933',
  Q: '#ad852d',
  R: '#04344c',
  S: '#529914',
  T: '#7d1f28',
  U: '#074462',
  V: '#3f760f',
  W: '#8a6a20',
  X: '#9f2933',
  Y: '#ad852d',
  Z: '#04344c',
};

function avatarColorFromInitials(initials) {
  const letter = initials
    ?.trim()
    .charAt(0)
    .toUpperCase();

  return avatarColors[letter] || '#04344c';
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
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 ${className}`}
        onError={() => setFailed(true)}
        src={source}
      />
    );
  }


  return (
    <div
      className={`${sizes[size]} grid place-items-center rounded-full font-black text-white ring-2 ring-white shadow-[0_10px_20px_rgba(4,52,76,0.18)] dark:ring-slate-800 ${className}`}
      style={{ backgroundColor: fallbackColor }}
    >
      {initials}
    </div>
  );
}

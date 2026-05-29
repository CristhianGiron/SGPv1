import { useEffect, useState } from 'react';
import { apiBlob } from '../api/client';
import { initialsFromProfile } from '../utils/format';

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

  if (source && !failed) {
    return (
      <img
        alt={profile?.username || 'Usuario'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`}
        onError={() => setFailed(true)}
        src={source}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} grid place-items-center rounded-full bg-emerald-100 font-black text-emerald-800 ring-2 ring-white dark:bg-[#203026] dark:text-[#bbf7d0] dark:ring-slate-800 ${className}`}
    >
      {initialsFromProfile(profile)}
    </div>
  );
}

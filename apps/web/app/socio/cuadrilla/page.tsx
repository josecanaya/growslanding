'use client';

import { useEffect, useState } from 'react';
import { MiCuadrilla } from '@/components/socio/sections/MiCuadrilla';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function CuadrillaPage() {
  const currentUser = useCurrentUser();
  const [user, setUser] = useState({
    name: 'Juan Pérez',
    avatar: '👷',
    rating: 4.8,
    level: 'Oro',
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser?.name) {
      setUser((prev) => ({
        ...prev,
        name: currentUser.name ?? prev.name,
        avatar: currentUser.name
          ? currentUser.name.charAt(0).toUpperCase()
          : prev.avatar,
      }));
    }
  }, [currentUser?.name]);

  return (
    <div className="w-full">
      <MiCuadrilla user={user} />
    </div>
  );
}

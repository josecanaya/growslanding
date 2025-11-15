'use client';

import { useEffect, useState } from 'react';
import { Notificaciones } from '@/components/socio/sections/Notificaciones';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function NotificacionesPage() {
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

  return <Notificaciones user={user} />;
}

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useNotificationsStore } from '@/lib/store/notifications.store';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);
  const addNotification = useNotificationsStore((state) => state.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('claim:updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['claim', data.claimId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    });

    socket.on('claim:assigned', (data) => {
      queryClient.invalidateQueries({ queryKey: ['claim', data.claimId] });
    });

    socket.on('notification:new', (data) => {
      addNotification(data);
    });

    socket.on('appeal:status_changed', (data) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', data.appealId] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, addNotification, queryClient]);

  return socketRef.current;
};
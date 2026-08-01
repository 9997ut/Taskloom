import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Label, User } from '../types';

export function useLabels() {
  return useQuery({
    queryKey: ['labels'],
    queryFn: () => api<{ labels: Label[] }>('/labels'),
    select: (data) => data.labels,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ users: User[] }>('/users'),
    select: (data) => data.users,
  });
}

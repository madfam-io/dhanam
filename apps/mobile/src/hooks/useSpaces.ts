import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/services/api';

export interface Space {
  id: string;
  name: string;
  type: 'personal' | 'business';
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export function useSpaces() {
  const { user, isAuthenticated } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSpaces();
    }
  }, [isAuthenticated, user]);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/spaces');
      setSpaces(response.data);
      
      // Set first space as current if none selected
      if (response.data.length > 0 && !currentSpace) {
        setCurrentSpace(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (data: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiClient.post('/spaces', data);
      const newSpace = response.data;
      setSpaces(prev => [...prev, newSpace]);
      return newSpace;
    } catch (error) {
      console.error('Failed to create space:', error);
      throw error;
    }
  };

  const switchSpace = (space: Space) => {
    setCurrentSpace(space);
  };

  return {
    spaces,
    currentSpace,
    loading,
    createSpace,
    switchSpace,
    refetch: loadSpaces,
  };
}
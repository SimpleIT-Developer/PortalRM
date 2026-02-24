import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VersionContent {
  content: string;
  hasVersion: boolean;
}

interface UserPreferences {
  showVersionNotifications: boolean;
}

export const useVersionNotification = () => {
  const queryClient = useQueryClient();

  // Buscar conteúdo da versão
  const {
    data: versionData,
    isLoading: isLoadingVersion,
    error: versionError
  } = useQuery<VersionContent>({
    queryKey: ['version-content'],
    queryFn: async () => {
      const response = await fetch('/api/version-content', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar conteúdo da versão');
      }
      return response.json();
    }
  });

  // Buscar preferências do usuário
  const {
    data: userPreferences,
    isLoading: isLoadingPreferences,
    error: preferencesError
  } = useQuery<UserPreferences>({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/users/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar preferências do usuário');
      }
      return response.json();
    }
  });

  // Mutation para atualizar preferência de notificação
  const updateNotificationPreference = useMutation({
    mutationFn: async (showNotifications: boolean) => {
      const response = await fetch('/api/users/version-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ showNotifications })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar preferência');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    }
  });

  // Determinar se deve mostrar o popup
  const shouldShowPopup = versionData?.hasVersion && userPreferences?.showVersionNotifications;

  return {
    versionData,
    userPreferences,
    shouldShowPopup,
    isLoadingVersion,
    isLoadingPreferences,
    versionError,
    preferencesError,
    updateNotificationPreference
  };
};
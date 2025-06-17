import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface StreamData {
  isLive: boolean;
  streamUrl: string;
  title: string;
  viewers: number;
  uptime: string;
  bitrate: number;
  startTime?: Date;
}

interface StreamContextType {
  streamData: StreamData;
  updateStreamData: (data: Partial<StreamData>) => void;
  startStream: () => void;
  stopStream: () => void;
  refreshStreamStatus: () => Promise<void>;
}

const StreamContext = createContext<StreamContextType | null>(null);

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
};

interface StreamProviderProps {
  children: ReactNode;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<StreamData>({
    isLive: false,
    streamUrl: '',
    title: '',
    viewers: 0,
    uptime: '00:00:00',
    bitrate: 0
  });

  const updateStreamData = (data: Partial<StreamData>) => {
    setStreamData(prev => ({ ...prev, ...data }));
  };

  const startStream = () => {
    const userLogin = user?.email?.split('@')[0] || 'usuario';
    const streamUrl = `https://stream.exemplo.com/${userLogin}/playlist.m3u8`;
    
    updateStreamData({
      isLive: true,
      streamUrl,
      title: `Transmissão ao vivo de ${user?.nome || 'Usuário'}`,
      startTime: new Date(),
      viewers: 0,
      bitrate: 2500
    });
  };

  const stopStream = () => {
    updateStreamData({
      isLive: false,
      streamUrl: '',
      viewers: 0,
      uptime: '00:00:00',
      bitrate: 0,
      startTime: undefined
    });
  };

  const refreshStreamStatus = async () => {
    if (!streamData.isLive) return;

    try {
      // Simular chamada para API para obter dados atualizados
      // Em produção, isso seria uma chamada real para sua API
      const mockData = {
        viewers: Math.floor(Math.random() * 150) + 10,
        bitrate: 2500 + Math.floor(Math.random() * 500),
      };

      updateStreamData(mockData);
    } catch (error) {
      console.error('Erro ao atualizar status da transmissão:', error);
    }
  };

  // Atualizar uptime quando a transmissão estiver ativa
  useEffect(() => {
    if (!streamData.isLive || !streamData.startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - streamData.startTime!.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const uptime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      updateStreamData({ uptime });
    }, 1000);

    return () => clearInterval(interval);
  }, [streamData.isLive, streamData.startTime]);

  // Atualizar dados da transmissão periodicamente
  useEffect(() => {
    if (!streamData.isLive) return;

    const interval = setInterval(refreshStreamStatus, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [streamData.isLive]);

  return (
    <StreamContext.Provider value={{
      streamData,
      updateStreamData,
      startStream,
      stopStream,
      refreshStreamStatus
    }}>
      {children}
    </StreamContext.Provider>
  );
};
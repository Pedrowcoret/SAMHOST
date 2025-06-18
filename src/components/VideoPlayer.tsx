import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Radio, Wifi, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamContext';

const VideoPlayer: React.FC = () => {
  const { user } = useAuth();
  const { streamData } = useStream();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Usar dados do contexto de stream
  const wowzaStreamUrl = streamData.isLive ? 
    `https://wowza.exemplo.com:443/live/${streamData.streamName}/playlist.m3u8` : '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setConnectionError(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setConnectionError(false);
    };
    const handleError = () => {
      setIsLoading(false);
      setConnectionError(true);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-play quando a transmissão estiver ao vivo
  useEffect(() => {
    if (streamData.isLive && videoRef.current && wowzaStreamUrl) {
      videoRef.current.src = wowzaStreamUrl;
      videoRef.current.load();
      
      // Tentar reproduzir automaticamente
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play foi bloqueado pelo navegador:', error);
        });
      }
    }
  }, [streamData.isLive, wowzaStreamUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !streamData.isLive) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Erro ao reproduzir:', error);
        setConnectionError(true);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const refreshStream = () => {
    const video = videoRef.current;
    if (!video || !wowzaStreamUrl) return;

    setIsLoading(true);
    setConnectionError(false);
    video.load();
    video.play().catch(error => {
      console.error('Erro ao recarregar stream:', error);
      setConnectionError(true);
      setIsLoading(false);
    });
  };

  const connectedPlatforms = streamData.platforms.filter(p => p.status === 'connected');

  return (
    <div 
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Status da Transmissão */}
      {streamData.isLive && (
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full flex items-center space-x-2 text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>AO VIVO</span>
          </div>
          
          <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm">
            <Wifi className="h-3 w-3" />
            <span>{streamData.viewers} espectadores</span>
          </div>

          {connectedPlatforms.length > 0 && (
            <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm">
              <Activity className="h-3 w-3" />
              <span>{connectedPlatforms.length} plataformas</span>
            </div>
          )}
        </div>
      )}

      {/* Wowza Status */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`px-3 py-1 rounded-full flex items-center space-x-2 text-sm font-medium ${
          streamData.wowzaStatus === 'online' ? 'bg-green-600 text-white' :
          streamData.wowzaStatus === 'error' ? 'bg-red-600 text-white' :
          'bg-gray-600 text-white'
        }`}>
          <Activity className="h-3 w-3" />
          <span>Wowza {streamData.wowzaStatus}</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white text-sm">Conectando ao Wowza...</span>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {connectionError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-75">
          <div className="flex flex-col items-center space-y-4 text-white text-center">
            <Wifi className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Erro de Conexão</h3>
              <p className="text-sm text-gray-300 mb-4">Não foi possível conectar ao stream Wowza</p>
              <button
                onClick={refreshStream}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={streamData.isLive ? wowzaStreamUrl : undefined}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Placeholder quando não há transmissão */}
      {!streamData.isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
          <Radio className="h-16 w-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma transmissão ativa</h3>
          <p className="text-gray-400 text-center max-w-md mb-4">
            Inicie uma transmissão no Wowza para visualizar o conteúdo ao vivo aqui
          </p>
          <div className="text-center text-sm text-gray-500">
            <p>Status do Wowza: <span className="font-medium">{streamData.wowzaStatus}</span></p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/iniciar-transmissao'}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Configurar Transmissão
          </button>
        </div>
      )}
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {streamData.isLive ? (
                <button
                  onClick={refreshStream}
                  className="text-white hover:text-accent transition-colors"
                  title="Recarregar transmissão"
                >
                  <RefreshCw className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-accent transition-colors"
                  disabled={!streamData.isLive}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-accent transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-6 w-6" />
                  ) : (
                    <Volume2 className="h-6 w-6" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-500 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.3) 0%)`
                  }}
                />
              </div>
              
              <div className="text-white text-sm">
                {streamData.isLive ? (
                  <span className="flex items-center space-x-2">
                    <span>Ao vivo</span>
                    <span>•</span>
                    <span>{streamData.uptime}</span>
                    {streamData.bitrate > 0 && (
                      <>
                        <span>•</span>
                        <span>{streamData.bitrate} kbps</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-accent transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-6 w-6" />
              ) : (
                <Maximize className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Square, Settings, Copy, ExternalLink, Radio, Users, BarChart3, Wifi, WifiOff, Youtube, Instagram, Facebook, Twitch, Video, Globe, Zap, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamContext';

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  rtmpUrl: string;
  streamKey: string;
  enabled: boolean;
}

const IniciarTransmissao: React.FC = () => {
  const { user } = useAuth();
  const { streamData, startStream, stopStream, updatePlatformConfig } = useStream();
  const [loading, setLoading] = useState(false);
  const [showPlatformConfig, setShowPlatformConfig] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfig[]>([
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-red-500',
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: '',
      enabled: false
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-pink-500',
      rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp',
      streamKey: '',
      enabled: false
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp',
      streamKey: '',
      enabled: false
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: Twitch,
      color: 'bg-purple-600',
      rtmpUrl: 'rtmp://live.twitch.tv/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'vimeo',
      name: 'Vimeo',
      icon: Video,
      color: 'bg-blue-500',
      rtmpUrl: 'rtmp://rtmp-global.cloud.vimeo.com/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Video,
      color: 'bg-black',
      rtmpUrl: 'rtmp://ingest.live.tiktok.com/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'periscope',
      name: 'Periscope',
      icon: Globe,
      color: 'bg-blue-400',
      rtmpUrl: 'rtmp://ingest.periscope.tv/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'kwai',
      name: 'Kwai',
      icon: Video,
      color: 'bg-yellow-500',
      rtmpUrl: 'rtmp://push.kwai.com/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'steam',
      name: 'Steam Valve',
      icon: Zap,
      color: 'bg-gray-700',
      rtmpUrl: 'rtmp://ingest.broadcast.steamcontent.com/live',
      streamKey: '',
      enabled: false
    },
    {
      id: 'rtmp',
      name: 'RTMP Próprio',
      icon: Activity,
      color: 'bg-green-600',
      rtmpUrl: '',
      streamKey: '',
      enabled: false
    }
  ]);

  const [wowzaConfig, setWowzaConfig] = useState({
    serverUrl: 'wowza.exemplo.com',
    port: '1935',
    application: 'live',
    streamName: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      const userLogin = user.email?.split('@')[0] || 'usuario';
      setWowzaConfig(prev => ({
        ...prev,
        streamName: `${userLogin}_stream`
      }));
    }
  }, [user]);

  const handleStartStream = async () => {
    const enabledPlatforms = platformConfigs.filter(p => p.enabled && p.streamKey);
    
    if (enabledPlatforms.length === 0) {
      toast.error('Configure pelo menos uma plataforma para transmitir');
      return;
    }

    setLoading(true);
    try {
      // Configurar plataformas no contexto
      enabledPlatforms.forEach(platform => {
        updatePlatformConfig(platform.id, {
          enabled: true,
          rtmpUrl: platform.rtmpUrl,
          streamKey: platform.streamKey,
          status: 'disconnected'
        });
      });

      await startStream(enabledPlatforms.map(p => p.id));
      toast.success('Transmissão iniciada com sucesso!');
    } catch (error) {
      toast.error('Erro ao iniciar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    setLoading(true);
    try {
      await stopStream();
      toast.success('Transmissão finalizada');
    } catch (error) {
      toast.error('Erro ao finalizar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformStreamKey = (platformId: string, streamKey: string) => {
    setPlatformConfigs(prev => 
      prev.map(p => p.id === platformId ? { ...p, streamKey } : p)
    );
  };

  const togglePlatform = (platformId: string) => {
    setPlatformConfigs(prev => 
      prev.map(p => p.id === platformId ? { ...p, enabled: !p.enabled } : p)
    );
  };

  const updateRtmpUrl = (platformId: string, rtmpUrl: string) => {
    setPlatformConfigs(prev => 
      prev.map(p => p.id === platformId ? { ...p, rtmpUrl } : p)
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
  };

  const wowzaStreamUrl = `rtmp://${wowzaConfig.serverUrl}:${wowzaConfig.port}/${wowzaConfig.application}/${wowzaConfig.streamName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-primary-600 hover:text-primary-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Radio className="h-8 w-8 mr-3 text-primary-600" />
          Gerenciar Transmissão Wowza
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(streamData.isLive)}`}>
            {getStatusIcon(streamData.isLive)}
            <span className="font-medium">{streamData.isLive ? 'Transmitindo' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Espectadores</p>
              <p className="text-2xl font-bold text-gray-900">{streamData.viewers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bitrate</p>
              <p className="text-2xl font-bold text-gray-900">{streamData.bitrate} kbps</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Radio className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tempo Online</p>
              <p className="text-2xl font-bold text-gray-900">{streamData.uptime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Plataformas</p>
              <p className="text-2xl font-bold text-gray-900">{streamData.platforms.filter(p => p.status === 'connected').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wowza Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuração do Servidor Wowza</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servidor Wowza</label>
            <input
              type="text"
              value={wowzaConfig.serverUrl}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="wowza.exemplo.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Porta</label>
            <input
              type="text"
              value={wowzaConfig.port}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, port: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="1935"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aplicação</label>
            <input
              type="text"
              value={wowzaConfig.application}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, application: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="live"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Stream</label>
            <input
              type="text"
              value={wowzaConfig.streamName}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, streamName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="meu_stream"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuário (opcional)</label>
            <input
              type="text"
              value={wowzaConfig.username}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="usuário"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha (opcional)</label>
            <input
              type="password"
              value={wowzaConfig.password}
              onChange={(e) => setWowzaConfig(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="senha"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">URL RTMP Wowza</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={wowzaStreamUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(wowzaStreamUrl, 'URL Wowza')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Configuração de Plataformas</h2>
          <button
            onClick={() => setShowPlatformConfig(!showPlatformConfig)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            {showPlatformConfig ? 'Ocultar' : 'Configurar'}
          </button>
        </div>

        {showPlatformConfig && (
          <div className="space-y-6">
            {platformConfigs.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${platform.color} rounded-lg`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">{platform.name}</span>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={platform.enabled}
                          onChange={() => togglePlatform(platform.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Ativar</span>
                      </label>
                    </div>
                  </div>

                  {platform.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL RTMP
                        </label>
                        <input
                          type="text"
                          value={platform.rtmpUrl}
                          onChange={(e) => updateRtmpUrl(platform.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="rtmp://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stream Key
                        </label>
                        <input
                          type="text"
                          value={platform.streamKey}
                          onChange={(e) => updatePlatformStreamKey(platform.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="Chave da plataforma..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Controle de Transmissão</h2>
        
        <div className="flex items-center justify-center space-x-4">
          {!streamData.isLive ? (
            <button
              onClick={handleStartStream}
              disabled={loading}
              className="flex items-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <Play className="h-6 w-6 mr-3" />
              {loading ? 'Iniciando...' : 'Iniciar Transmissão'}
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              disabled={loading}
              className="flex items-center px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <Square className="h-6 w-6 mr-3" />
              {loading ? 'Finalizando...' : 'Finalizar Transmissão'}
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* Connected Platforms Status */}
      {streamData.isLive && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Status das Plataformas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streamData.platforms.map((platform) => {
              const config = platformConfigs.find(p => p.id === platform.id);
              const IconComponent = config?.icon || Activity;
              const statusColor = platform.status === 'connected' ? 'bg-green-100 border-green-200 text-green-800' :
                                platform.status === 'connecting' ? 'bg-yellow-100 border-yellow-200 text-yellow-800' :
                                platform.status === 'error' ? 'bg-red-100 border-red-200 text-red-800' :
                                'bg-gray-100 border-gray-200 text-gray-800';

              return (
                <div key={platform.id} className={`p-4 rounded-lg border ${statusColor}`}>
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm capitalize">{platform.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar o Wowza</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
            <p>Configure o servidor Wowza com as informações corretas (servidor, porta, aplicação)</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
            <p>Ative e configure as plataformas desejadas com suas respectivas chaves de transmissão</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
            <p>Configure seu software de transmissão (OBS, Streamlabs) para enviar para o servidor Wowza</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
            <p>Clique em "Iniciar Transmissão" para ativar o push para todas as plataformas configuradas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IniciarTransmissao;
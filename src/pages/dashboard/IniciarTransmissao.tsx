import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Square, Settings, Copy, Radio, Users, BarChart3, Wifi, WifiOff, Youtube, Instagram, Facebook, Twitch, Video, Globe, Zap, Activity, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamContext';

interface Platform {
  id: string;
  nome: string;
  codigo: string;
  icone: string;
  rtmp_base_url: string;
  requer_stream_key: boolean;
}

interface UserPlatform {
  id: string;
  id_platform: string;
  stream_key: string;
  rtmp_url: string;
  titulo_padrao?: string;
  descricao_padrao?: string;
  ativo: boolean;
  platform: Platform;
}

interface Playlist {
  id: number;
  nome: string;
}

interface TransmissionStatus {
  is_live: boolean;
  transmission?: {
    id: string;
    titulo: string;
    status: string;
    data_inicio: string;
    stats: {
      viewers: number;
      bitrate: number;
      uptime: string;
      isActive: boolean;
    };
    platforms: Array<{
      user_platform: {
        platform: Platform;
      };
      status: string;
    }>;
  };
}

const IniciarTransmissao: React.FC = () => {
  const { getToken } = useAuth();
  const { streamData, updateStreamData } = useStream();
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [transmissionStatus, setTransmissionStatus] = useState<TransmissionStatus>({ is_live: false });
  
  const [loading, setLoading] = useState(false);
  const [showPlatformConfig, setShowPlatformConfig] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  
  // Form para nova plataforma
  const [newPlatformForm, setNewPlatformForm] = useState({
    platform_id: '',
    stream_key: '',
    rtmp_url: '',
    titulo_padrao: '',
    descricao_padrao: ''
  });

  // Form para transmissão
  const [transmissionForm, setTransmissionForm] = useState({
    titulo: '',
    descricao: ''
  });

  const [wowzaConnected, setWowzaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    loadInitialData();
    checkTransmissionStatus();
    testWowzaConnection();

    // Atualizar status a cada 30 segundos se estiver transmitindo
    const interval = setInterval(() => {
      if (transmissionStatus.is_live) {
        checkTransmissionStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      const token = await getToken();
      
      // Carregar plataformas disponíveis
      const platformsResponse = await fetch('/api/streaming/platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const platformsData = await platformsResponse.json();
      if (platformsData.success) {
        setPlatforms(platformsData.platforms);
      }

      // Carregar plataformas configuradas pelo usuário
      const userPlatformsResponse = await fetch('/api/streaming/user-platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userPlatformsData = await userPlatformsResponse.json();
      if (userPlatformsData.success) {
        setUserPlatforms(userPlatformsData.platforms);
      }

      // Carregar playlists
      const playlistsResponse = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const playlistsData = await playlistsResponse.json();
      setPlaylists(playlistsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados iniciais');
    }
  };

  const testWowzaConnection = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/wowza/test-connection', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      setWowzaConnected(result.connected);
    } catch (error) {
      console.error('Erro ao testar conexão Wowza:', error);
      setWowzaConnected(false);
    }
  };

  const checkTransmissionStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setTransmissionStatus(result);
        
        // Atualizar contexto de stream
        if (result.is_live && result.transmission) {
          updateStreamData({
            isLive: true,
            viewers: result.transmission.stats.viewers,
            bitrate: result.transmission.stats.bitrate,
            uptime: result.transmission.stats.uptime,
            title: result.transmission.titulo
          });
        } else {
          updateStreamData({
            isLive: false,
            viewers: 0,
            bitrate: 0,
            uptime: '00:00:00'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleConfigurePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlatformForm.platform_id || !newPlatformForm.stream_key) {
      toast.error('Plataforma e Stream Key são obrigatórios');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/configure-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPlatformForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Plataforma configurada com sucesso!');
        setNewPlatformForm({
          platform_id: '',
          stream_key: '',
          rtmp_url: '',
          titulo_padrao: '',
          descricao_padrao: ''
        });
        loadInitialData(); // Recarregar dados
      } else {
        toast.error(result.error || 'Erro ao configurar plataforma');
      }
    } catch (error) {
      console.error('Erro ao configurar plataforma:', error);
      toast.error('Erro ao configurar plataforma');
    }
  };

  const handleStartTransmission = async () => {
    if (!transmissionForm.titulo) {
      toast.error('Título da transmissão é obrigatório');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecione pelo menos uma plataforma');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: transmissionForm.titulo,
          descricao: transmissionForm.descricao,
          playlist_id: selectedPlaylist || null,
          platform_ids: selectedPlatforms
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão iniciada com sucesso!');
        checkTransmissionStatus();
        setTransmissionForm({ titulo: '', descricao: '' });
        setSelectedPlatforms([]);
        setSelectedPlaylist('');
      } else {
        toast.error(result.error || 'Erro ao iniciar transmissão');
      }
    } catch (error) {
      console.error('Erro ao iniciar transmissão:', error);
      toast.error('Erro ao iniciar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTransmission = async () => {
    if (!transmissionStatus.transmission) return;

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/streaming/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transmission_id: transmissionStatus.transmission.id
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Transmissão finalizada com sucesso!');
        checkTransmissionStatus();
      } else {
        toast.error(result.error || 'Erro ao finalizar transmissão');
      }
    } catch (error) {
      console.error('Erro ao finalizar transmissão:', error);
      toast.error('Erro ao finalizar transmissão');
    } finally {
      setLoading(false);
    }
  };

  const removePlatform = async (platformId: string) => {
    if (!confirm('Deseja remover esta plataforma?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/streaming/user-platforms/${platformId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plataforma removida com sucesso!');
        loadInitialData();
      } else {
        toast.error('Erro ao remover plataforma');
      }
    } catch (error) {
      console.error('Erro ao remover plataforma:', error);
      toast.error('Erro ao remover plataforma');
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      youtube: Youtube,
      instagram: Instagram,
      facebook: Facebook,
      twitch: Twitch,
      video: Video,
      globe: Globe,
      zap: Zap,
      activity: Activity
    };
    return icons[iconName] || Activity;
  };

  const getStatusColor = (connected: boolean | null) => {
    if (connected === null) return 'text-gray-600 bg-gray-100';
    return connected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

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
          Gerenciar Transmissão
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(wowzaConnected)}`}>
            {wowzaConnected === null ? (
              <Activity className="h-4 w-4 animate-pulse" />
            ) : wowzaConnected ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="font-medium">
              {wowzaConnected === null ? 'Verificando...' : wowzaConnected ? 'Servidor Online' : 'Servidor Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Status da transmissão atual */}
      {transmissionStatus.is_live && transmissionStatus.transmission && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <h2 className="text-lg font-semibold text-green-800">TRANSMISSÃO AO VIVO</h2>
            </div>
            <button
              onClick={handleStopTransmission}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Square className="h-4 w-4 mr-2" />
              {loading ? 'Finalizando...' : 'Finalizar Transmissão'}
            </button>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-green-800">{transmissionStatus.transmission.titulo}</h3>
            <p className="text-sm text-green-600">
              Iniciada em: {new Date(transmissionStatus.transmission.data_inicio).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Espectadores</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.viewers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Bitrate</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.bitrate} kbps</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Wifi className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Tempo Ativo</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.stats.uptime}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center">
                <Radio className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Plataformas</p>
                  <p className="text-xl font-bold">{transmissionStatus.transmission.platforms.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plataformas ativas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {transmissionStatus.transmission.platforms.map((tp, index) => {
              const IconComponent = getIconComponent(tp.user_platform.platform.icone);
              const statusColor = tp.status === 'ativa' ? 'bg-green-100 border-green-200 text-green-800' :
                                tp.status === 'erro' ? 'bg-red-100 border-red-200 text-red-800' :
                                'bg-gray-100 border-gray-200 text-gray-800';

              return (
                <div key={index} className={`p-3 rounded-lg border ${statusColor}`}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{tp.user_platform.platform.nome}</p>
                      <p className="text-sm capitalize">{tp.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuração de plataformas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Plataformas Configuradas</h2>
          <button
            onClick={() => setShowPlatformConfig(!showPlatformConfig)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Plataforma
          </button>
        </div>

        {/* Lista de plataformas configuradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {userPlatforms.map((up) => {
            const IconComponent = getIconComponent(up.platform.icone);
            return (
              <div key={up.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-primary-600" />
                    <span className="font-medium">{up.platform.nome}</span>
                  </div>
                  <button
                    onClick={() => removePlatform(up.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  Key: {up.stream_key.substring(0, 20)}...
                </p>
                {up.titulo_padrao && (
                  <p className="text-sm text-gray-600 truncate">
                    Título: {up.titulo_padrao}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Formulário para nova plataforma */}
        {showPlatformConfig && (
          <form onSubmit={handleConfigurePlatform} className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Configurar Nova Plataforma</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <select
                  value={newPlatformForm.platform_id}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, platform_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Selecione uma plataforma</option>
                  {platforms.filter(p => !userPlatforms.some(up => up.id_platform === p.id)).map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream Key
                </label>
                <input
                  type="text"
                  value={newPlatformForm.stream_key}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, stream_key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Chave de transmissão da plataforma"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL RTMP (opcional)
                </label>
                <input
                  type="text"
                  value={newPlatformForm.rtmp_url}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, rtmp_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="URL personalizada (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título Padrão (opcional)
                </label>
                <input
                  type="text"
                  value={newPlatformForm.titulo_padrao}
                  onChange={(e) => setNewPlatformForm(prev => ({ ...prev, titulo_padrao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Título padrão para transmissões"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição Padrão (opcional)
              </label>
              <textarea
                value={newPlatformForm.descricao_padrao}
                onChange={(e) => setNewPlatformForm(prev => ({ ...prev, descricao_padrao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Descrição padrão para transmissões"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPlatformConfig(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Salvar Plataforma
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Iniciar nova transmissão */}
      {!transmissionStatus.is_live && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar Nova Transmissão</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Transmissão *
                </label>
                <input
                  type="text"
                  value={transmissionForm.titulo}
                  onChange={(e) => setTransmissionForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Digite o título da transmissão"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist (opcional)
                </label>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Transmissão manual</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={transmissionForm.descricao}
                onChange={(e) => setTransmissionForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Descrição da transmissão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Plataformas *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userPlatforms.map((up) => {
                  const IconComponent = getIconComponent(up.platform.icone);
                  const isSelected = selectedPlatforms.includes(up.id);
                  
                  return (
                    <label
                      key={up.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms(prev => [...prev, up.id]);
                          } else {
                            setSelectedPlatforms(prev => prev.filter(id => id !== up.id));
                          }
                        }}
                        className="sr-only"
                      />
                      <IconComponent className="h-5 w-5 text-primary-600 mr-3" />
                      <span className="font-medium">{up.platform.nome}</span>
                    </label>
                  );
                })}
              </div>
              {userPlatforms.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Nenhuma plataforma configurada. Configure pelo menos uma plataforma acima.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleStartTransmission}
                disabled={loading || !wowzaConnected || userPlatforms.length === 0}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Play className="h-5 w-5 mr-2" />
                {loading ? 'Iniciando...' : 'Iniciar Transmissão'}
              </button>
            </div>

            {!wowzaConnected && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Servidor de transmissão não está disponível. Verifique a conexão.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
            <p>Configure suas plataformas de streaming (YouTube, Facebook, etc.) com as chaves de transmissão</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
            <p>Preencha o título da transmissão e selecione as plataformas desejadas</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
            <p>Configure seu software de transmissão (OBS, Streamlabs) para enviar para nosso servidor</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
            <p>Clique em "Iniciar Transmissão" e comece a transmitir para todas as plataformas simultaneamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IniciarTransmissao;
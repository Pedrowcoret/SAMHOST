import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Square, Settings, Copy, ExternalLink, Radio, Users, BarChart3, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamContext';

interface ServerData {
  nome: string;
  nome_principal?: string;
  ip: string;
  porta_ssh: number;
  usuario_ssh: string;
  senha_ssh: string;
}

interface ConfigData {
  dominio_padrao: string;
}

const IniciarTransmissao: React.FC = () => {
  const { user } = useAuth();
  const { streamData, startStream, stopStream } = useStream();
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamUrls, setStreamUrls] = useState({
    rtmp: '',
    http: '',
    embed: '',
    share: ''
  });

  // Mock data - em produção, isso viria da API
  useEffect(() => {
    const mockServerData: ServerData = {
      nome: 'servidor1',
      nome_principal: 'stream',
      ip: '192.168.1.100',
      porta_ssh: 22,
      usuario_ssh: 'root',
      senha_ssh: 'password'
    };

    const mockConfigData: ConfigData = {
      dominio_padrao: 'exemplo.com'
    };

    setServerData(mockServerData);
    setConfigData(mockConfigData);

    // Gerar URLs baseadas nos dados
    if (user && mockServerData && mockConfigData) {
      const userLogin = user.email?.split('@')[0] || 'usuario';
      const servidor = mockServerData.nome_principal 
        ? `${mockServerData.nome_principal.toLowerCase()}.${mockConfigData.dominio_padrao}`
        : `${mockServerData.nome.toLowerCase()}.${mockConfigData.dominio_padrao}`;

      const urls = {
        rtmp: `rtmp://${servidor}:1935/${userLogin}/${userLogin}`,
        http: `https://${servidor}/${userLogin}/${userLogin}/playlist.m3u8`,
        embed: `<iframe src="https://${servidor}/player/embed/?stream=${userLogin}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`,
        share: `https://${servidor}/watch?id=${userLogin}`
      };

      setStreamUrls(urls);
    }
  }, [user]);

  const handleStartStream = async () => {
    setLoading(true);
    try {
      // Aqui você faria a chamada SSH para iniciar o stream
      // Simulando delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      startStream(); // Usar o contexto para iniciar a transmissão
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
      // Aqui você faria a chamada SSH para parar o stream
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      stopStream(); // Usar o contexto para parar a transmissão
      toast.success('Transmissão finalizada');
    } catch (error) {
      toast.error('Erro ao finalizar transmissão');
    } finally {
      setLoading(false);
    }
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
          <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${getStatusColor(streamData.isLive)}`}>
            {getStatusIcon(streamData.isLive)}
            <span className="font-medium">{streamData.isLive ? 'Online' : 'Offline'}</span>
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
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-2xl font-bold text-gray-900">{streamData.isLive ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        </div>
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

      {/* Stream URLs */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">URLs de Transmissão</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL RTMP (Para OBS/Streamlabs)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={streamUrls.rtmp}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(streamUrls.rtmp, 'URL RTMP')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL HLS (Para reprodução)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={streamUrls.http}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(streamUrls.http, 'URL HLS')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={streamUrls.http}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Compartilhamento
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={streamUrls.share}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(streamUrls.share, 'URL de compartilhamento')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={streamUrls.share}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Incorporação (iFrame)
            </label>
            <div className="flex items-start space-x-2">
              <textarea
                value={streamUrls.embed}
                readOnly
                rows={4}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm resize-none"
              />
              <button
                onClick={() => copyToClipboard(streamUrls.embed, 'Código de incorporação')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
            <p>Configure seu software de transmissão (OBS, Streamlabs, etc.) com a URL RTMP fornecida acima</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
            <p>Clique em "Iniciar Transmissão" para ativar o servidor de streaming</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
            <p>Inicie a transmissão no seu software e compartilhe a URL de visualização com sua audiência</p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
            <p>Monitore as estatísticas em tempo real no painel acima e no player do dashboard principal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IniciarTransmissao;
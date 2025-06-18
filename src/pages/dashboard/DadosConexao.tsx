import React from 'react';
import { ChevronLeft, Copy, Server, Wifi, Settings, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const DadosConexao: React.FC = () => {
  const { user } = useAuth();
  
  const userLogin = user?.email?.split('@')[0] || 'usuario';
  
  const wowzaData = {
    serverUrl: 'wowza.exemplo.com',
    port: '1935',
    application: 'live',
    streamName: `${userLogin}_stream`,
    rtmpUrl: `rtmp://wowza.exemplo.com:1935/live/${userLogin}_stream`,
    hlsUrl: `https://wowza.exemplo.com:443/live/${userLogin}_stream/playlist.m3u8`,
    restApiUrl: 'https://wowza.exemplo.com:8087/v2',
    adminUrl: 'https://wowza.exemplo.com:8088/enginemanager',
    username: 'admin',
    password: 'password123'
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="flex items-center text-primary-600 hover:text-primary-800">
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <Server className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Dados de Conexão Wowza</h1>
      </div>

      {/* Wowza Server Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">Informações do Servidor Wowza</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Servidor Wowza</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  {wowzaData.serverUrl}
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.serverUrl, 'Servidor Wowza')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Porta RTMP</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  {wowzaData.port}
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.port, 'Porta')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Aplicação</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  {wowzaData.application}
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.application, 'Aplicação')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nome do Stream</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  {wowzaData.streamName}
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.streamName, 'Nome do Stream')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Usuário Admin</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  {wowzaData.username}
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.username, 'Usuário')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Senha Admin</h3>
              <div className="mt-1 flex items-center">
                <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full">
                  ••••••••••••
                </span>
                <button 
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  onClick={() => copyToClipboard(wowzaData.password, 'Senha')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* URLs de Transmissão */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Wifi className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">URLs de Transmissão</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL RTMP (Para OBS/Streamlabs)</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {wowzaData.rtmpUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(wowzaData.rtmpUrl, 'URL RTMP')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL HLS (Para reprodução)</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {wowzaData.hlsUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(wowzaData.hlsUrl, 'URL HLS')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">REST API URL</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {wowzaData.restApiUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(wowzaData.restApiUrl, 'REST API URL')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Engine Manager URL</h3>
            <div className="mt-1 flex items-center">
              <span className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-md w-full text-sm">
                {wowzaData.adminUrl}
              </span>
              <button 
                className="ml-2 text-primary-600 hover:text-primary-800"
                onClick={() => copyToClipboard(wowzaData.adminUrl, 'Engine Manager URL')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Configurações Recomendadas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">Configurações Recomendadas</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">OBS Studio</h3>
            <p className="text-gray-600 mb-4">Configurações recomendadas para transmissão com OBS Studio</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Servidor: <span className="font-medium font-mono">{wowzaData.rtmpUrl}</span></li>
                <li>Chave de transmissão: <span className="font-medium">Deixar em branco ou usar nome do stream</span></li>
                <li>Taxa de bits de vídeo: <span className="font-medium">2500-5000 Kbps</span></li>
                <li>Taxa de bits de áudio: <span className="font-medium">128-320 Kbps</span></li>
                <li>Resolução: <span className="font-medium">1920x1080 (1080p) ou 1280x720 (720p)</span></li>
                <li>FPS: <span className="font-medium">30 ou 60</span></li>
                <li>Preset de codificação: <span className="font-medium">veryfast ou fast</span></li>
                <li>Perfil: <span className="font-medium">main ou high</span></li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Streamlabs</h3>
            <p className="text-gray-600 mb-4">Configurações recomendadas para transmissão com Streamlabs</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Servidor: <span className="font-medium font-mono">{wowzaData.rtmpUrl}</span></li>
                <li>Chave de transmissão: <span className="font-medium">Deixar em branco</span></li>
                <li>Taxa de bits de vídeo: <span className="font-medium">2500-5000 Kbps</span></li>
                <li>Taxa de bits de áudio: <span className="font-medium">128-320 Kbps</span></li>
                <li>Resolução: <span className="font-medium">1920x1080 (1080p) ou 1280x720 (720p)</span></li>
                <li>FPS: <span className="font-medium">30 ou 60</span></li>
                <li>Preset de codificação: <span className="font-medium">veryfast ou fast</span></li>
                <li>Perfil: <span className="font-medium">main ou high</span></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Wowza Engine Manager</h3>
            <p className="text-gray-600 mb-4">Acesso ao painel administrativo do Wowza</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>URL: <span className="font-medium font-mono">{wowzaData.adminUrl}</span></li>
                <li>Usuário: <span className="font-medium">{wowzaData.username}</span></li>
                <li>Senha: <span className="font-medium">••••••••••••</span></li>
                <li>Use este painel para monitorar streams, configurar aplicações e gerenciar o servidor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">⚠️ Informações Importantes</h3>
        <div className="space-y-2 text-yellow-800">
          <p>• Certifique-se de que o servidor Wowza está rodando antes de iniciar a transmissão</p>
          <p>• As configurações de bitrate devem ser ajustadas conforme sua conexão de internet</p>
          <p>• Para transmissões em múltiplas plataformas, o servidor Wowza fará o push automático</p>
          <p>• Monitore o uso de CPU e memória do servidor durante transmissões longas</p>
          <p>• Mantenha backups regulares das configurações do Wowza</p>
        </div>
      </div>
    </div>
  );
};

export default DadosConexao;
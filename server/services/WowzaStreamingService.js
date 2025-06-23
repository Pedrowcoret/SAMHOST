import DigestFetch from 'digest-fetch';
import fetch from 'node-fetch';

export class WowzaStreamingService {
    constructor() {
        this.wowzaHost = '51.222.156.223';
        this.wowzaPassword = 'FK38Ca2SuE6jvJXed97VMn';
        this.wowzaUser = 'admin'; // usuário padrão do Wowza
        this.wowzaPort = 6980; // porta padrão da API REST do Wowza
        this.baseUrl = `http://${this.wowzaHost}:${this.wowzaPort}`;
        this.client = new DigestFetch(this.wowzaUser, this.wowzaPassword);
        this.activeStreams = new Map(); // Para controlar streams ativas
    }

    // Fazer requisição para API do Wowza com Digest Auth
    async makeWowzaRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await this.client.fetch(url, options);
            const text = await response.text();

            let parsedData;
            try {
                parsedData = text ? JSON.parse(text) : {};
            } catch {
                parsedData = text;
            }

            return {
                statusCode: response.status,
                data: parsedData,
                success: response.ok
            };
        } catch (error) {
            console.error('Erro em makeWowzaRequest:', error);
            return { success: false, error: error.message };
        }
    }

    // Criar aplicação no Wowza se não existir
    async ensureApplication(appName = 'live') {
        try {
            // Verificar se aplicação existe
            const checkResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/${appName}`
            );

            if (checkResult.success) {
                return { success: true, exists: true };
            }

            // Criar aplicação se não existir
            const appConfig = {
                name: appName,
                appType: 'Live',
                description: 'Live streaming application',
                streamConfig: {
                    streamType: 'live'
                }
            };

            const createResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications`,
                'POST',
                appConfig
            );

            return {
                success: createResult.success,
                exists: false,
                created: createResult.success
            };

        } catch (error) {
            console.error('Erro ao verificar/criar aplicação:', error);
            return { success: false, error: error.message };
        }
    }

    // Iniciar transmissão
    async startStream({ streamId, userId, playlistId, videos, server }) {
        try {
            console.log(`Iniciando transmissão - Stream ID: ${streamId}`);

            // Garantir que a aplicação existe
            const appResult = await this.ensureApplication();
            if (!appResult.success) {
                throw new Error('Falha ao configurar aplicação no Wowza');
            }

            // Gerar nome único para o stream
            const streamName = `stream_${streamId}_${Date.now()}`;

            // Configurar stream no Wowza
            const streamConfig = {
                name: streamName,
                sourceStreamName: streamName,
                destinationStreamName: streamName,
                applicationName: 'live'
            };

            // Criar stream no Wowza
            const createStreamResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/live/instances/_definst_/incomingstreams/${streamName}`,
                'PUT',
                streamConfig
            );

            if (!createStreamResult.success) {
                throw new Error(`Falha ao criar stream no Wowza: ${JSON.stringify(createStreamResult.data)}`);
            }

            // Iniciar playlist de vídeos
            const playlistResult = await this.startVideoPlaylist(streamName, videos);

            // Armazenar informações do stream ativo
            this.activeStreams.set(streamId, {
                streamName,
                wowzaStreamId: streamName,
                videos,
                currentVideoIndex: 0,
                startTime: new Date(),
                playlistId
            });

            return {
                success: true,
                data: {
                    streamName,
                    wowzaStreamId: streamName,
                    rtmpUrl: `rtmp://${this.wowzaHost}/live`,
                    playUrl: `http://${this.wowzaHost}:1935/live/${streamName}/playlist.m3u8`,
                    hlsUrl: `http://${this.wowzaHost}:1935/live/${streamName}/playlist.m3u8`,
                    dashUrl: `http://${this.wowzaHost}:1935/live/${streamName}/manifest.mpd`
                },
                bitrate: 2500 // bitrate padrão
            };

        } catch (error) {
            console.error('Erro ao iniciar stream:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Iniciar playlist de vídeos (simulação - em produção seria integração com FFmpeg)
    async startVideoPlaylist(streamName, videos) {
        try {
            console.log(`Iniciando playlist para stream: ${streamName} com ${videos.length} vídeos`);

            // Simulação de execução real de FFmpeg
            return {
                success: true,
                message: `Playlist iniciada com ${videos.length} vídeos`
            };

        } catch (error) {
            console.error('Erro ao iniciar playlist:', error);
            throw error;
        }
    }

    // Parar transmissão
    async stopStream(streamId) {
        try {
            const streamInfo = this.activeStreams.get(streamId);

            if (!streamInfo) {
                return {
                    success: true,
                    message: 'Stream não estava ativo'
                };
            }

            // Parar stream no Wowza
            const stopResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/live/instances/_definst_/incomingstreams/${streamInfo.streamName}`,
                'DELETE'
            );

            // Remover das streams ativas
            this.activeStreams.delete(streamId);

            return {
                success: true,
                wowzaResult: stopResult,
                message: 'Stream parado com sucesso'
            };

        } catch (error) {
            console.error('Erro ao parar stream:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obter estatísticas do stream
    async getStreamStats(streamId) {
        try {
            const streamInfo = this.activeStreams.get(streamId);

            if (!streamInfo) {
                return {
                    isActive: false,
                    viewers: 0,
                    bitrate: 0,
                    uptime: '00:00:00'
                };
            }

            // Buscar estatísticas do Wowza
            const statsResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/live/instances/_definst_/incomingstreams/${streamInfo.streamName}/stats`
            );

            let viewers = 0;
            let bitrate = 0;

            if (statsResult.success && statsResult.data) {
                viewers = statsResult.data.messagesInCountTotal || 0;
                bitrate = statsResult.data.messagesInBytesRate || 0;
            }

            // Calcular uptime
            const uptime = this.calculateUptime(streamInfo.startTime);

            return {
                isActive: true,
                viewers,
                bitrate,
                uptime,
                currentVideo: streamInfo.currentVideoIndex + 1,
                totalVideos: streamInfo.videos.length,
                wowzaStats: statsResult.data
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {
                isActive: false,
                viewers: 0,
                bitrate: 0,
                uptime: '00:00:00',
                error: error.message
            };
        }
    }

    // Calcular tempo de atividade
    calculateUptime(startTime) {
        const now = new Date();
        const diff = now - startTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Verificar conexão com Wowza
    async testConnection() {
        try {
            const result = await this.makeWowzaRequest('/v2/servers/_defaultServer_');
            return {
                success: result.success,
                connected: result.success,
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }

    // Listar aplicações disponíveis
    async listApplications() {
        try {
            const result = await this.makeWowzaRequest('/v2/servers/_defaultServer_/applications');
            return result;
        } catch (error) {
            console.error('Erro ao listar aplicações:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

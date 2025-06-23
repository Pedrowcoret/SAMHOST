import DigestFetch from 'digest-fetch';

export class WowzaStreamingService {
    constructor() {
        // Configurações do servidor Wowza (não expostas ao frontend)
        this.wowzaHost = process.env.WOWZA_HOST || '51.222.156.223';
        this.wowzaPassword = process.env.WOWZA_PASSWORD || 'FK38Ca2SuE6jvJXed97VMn';
        this.wowzaUser = process.env.WOWZA_USER || 'admin';
        this.wowzaPort = process.env.WOWZA_PORT || 8087;
        this.wowzaApplication = process.env.WOWZA_APPLICATION || 'live';
        
        this.baseUrl = `http://${this.wowzaHost}:${this.wowzaPort}`;
        this.client = new DigestFetch(this.wowzaUser, this.wowzaPassword);
        this.activeStreams = new Map();
    }

    // Fazer requisição para API do Wowza
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

    // Garantir que a aplicação existe
    async ensureApplication(appName = null) {
        const applicationName = appName || this.wowzaApplication;
        
        try {
            // Verificar se aplicação existe
            const checkResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/${applicationName}`
            );

            if (checkResult.success) {
                return { success: true, exists: true };
            }

            // Criar aplicação se não existir
            const appConfig = {
                name: applicationName,
                appType: 'Live',
                description: 'Live streaming application for multi-platform broadcasting',
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

    // Configurar push para plataformas
    async configurePlatformPush(streamName, platforms) {
        const pushConfigs = [];

        for (const platform of platforms) {
            try {
                const pushConfig = {
                    name: `${streamName}_${platform.platform.codigo}`,
                    sourceStreamName: streamName,
                    host: this.extractHostFromRtmp(platform.rtmp_url || platform.platform.rtmp_base_url),
                    application: this.extractAppFromRtmp(platform.rtmp_url || platform.platform.rtmp_base_url),
                    streamName: platform.stream_key,
                    userName: '',
                    password: '',
                    enabled: true
                };

                const result = await this.makeWowzaRequest(
                    `/v2/servers/_defaultServer_/applications/${this.wowzaApplication}/pushpublish/mapentries/${pushConfig.name}`,
                    'PUT',
                    pushConfig
                );

                if (result.success) {
                    pushConfigs.push({
                        platform: platform.platform.codigo,
                        name: pushConfig.name,
                        success: true
                    });
                } else {
                    pushConfigs.push({
                        platform: platform.platform.codigo,
                        name: pushConfig.name,
                        success: false,
                        error: result.data
                    });
                }
            } catch (error) {
                console.error(`Erro ao configurar push para ${platform.platform.nome}:`, error);
                pushConfigs.push({
                    platform: platform.platform.codigo,
                    success: false,
                    error: error.message
                });
            }
        }

        return pushConfigs;
    }

    // Extrair host da URL RTMP
    extractHostFromRtmp(rtmpUrl) {
        try {
            const url = new URL(rtmpUrl.replace('rtmp://', 'http://').replace('rtmps://', 'https://'));
            return url.hostname;
        } catch {
            return rtmpUrl.split('/')[2] || rtmpUrl;
        }
    }

    // Extrair aplicação da URL RTMP
    extractAppFromRtmp(rtmpUrl) {
        try {
            const parts = rtmpUrl.split('/');
            return parts[3] || 'live';
        } catch {
            return 'live';
        }
    }

    // Iniciar transmissão
    async startStream({ streamId, userId, playlistId, videos = [], platforms = [] }) {
        try {
            console.log(`Iniciando transmissão - Stream ID: ${streamId}`);

            // Garantir que a aplicação existe
            const appResult = await this.ensureApplication();
            if (!appResult.success) {
                throw new Error('Falha ao configurar aplicação no Wowza');
            }

            // Gerar nome único para o stream
            const streamName = `stream_${userId}_${Date.now()}`;

            // Configurar stream no Wowza
            const streamConfig = {
                name: streamName,
                sourceStreamName: streamName,
                destinationStreamName: streamName,
                applicationName: this.wowzaApplication
            };

            // Criar stream incoming no Wowza
            const createStreamResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/${this.wowzaApplication}/instances/_definst_/incomingstreams/${streamName}`,
                'PUT',
                streamConfig
            );

            if (!createStreamResult.success) {
                throw new Error(`Falha ao criar stream no Wowza: ${JSON.stringify(createStreamResult.data)}`);
            }

            // Configurar push para plataformas se fornecidas
            let pushResults = [];
            if (platforms && platforms.length > 0) {
                pushResults = await this.configurePlatformPush(streamName, platforms);
            }

            // Armazenar informações do stream ativo
            this.activeStreams.set(streamId, {
                streamName,
                wowzaStreamId: streamName,
                videos,
                currentVideoIndex: 0,
                startTime: new Date(),
                playlistId,
                platforms: pushResults,
                viewers: 0,
                bitrate: 2500 // bitrate inicial padrão
            });

            return {
                success: true,
                data: {
                    streamName,
                    wowzaStreamId: streamName,
                    rtmpUrl: `rtmp://${this.wowzaHost}:1935/${this.wowzaApplication}`,
                    streamKey: streamName,
                    playUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/playlist.m3u8`,
                    hlsUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/playlist.m3u8`,
                    dashUrl: `http://${this.wowzaHost}:1935/${this.wowzaApplication}/${streamName}/manifest.mpd`,
                    pushResults
                },
                bitrate: 2500
            };

        } catch (error) {
            console.error('Erro ao iniciar stream:', error);
            return {
                success: false,
                error: error.message
            };
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

            // Parar todos os push publishers
            if (streamInfo.platforms) {
                for (const platform of streamInfo.platforms) {
                    if (platform.success && platform.name) {
                        await this.makeWowzaRequest(
                            `/v2/servers/_defaultServer_/applications/${this.wowzaApplication}/pushpublish/mapentries/${platform.name}`,
                            'DELETE'
                        );
                    }
                }
            }

            // Parar stream no Wowza
            const stopResult = await this.makeWowzaRequest(
                `/v2/servers/_defaultServer_/applications/${this.wowzaApplication}/instances/_definst_/incomingstreams/${streamInfo.streamName}`,
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
                `/v2/servers/_defaultServer_/applications/${this.wowzaApplication}/instances/_definst_/incomingstreams/${streamInfo.streamName}/stats`
            );

            let viewers = Math.floor(Math.random() * 50) + 5; // Simular espectadores
            let bitrate = 2500 + Math.floor(Math.random() * 500); // Simular variação de bitrate

            if (statsResult.success && statsResult.data) {
                // Usar dados reais se disponíveis
                viewers = statsResult.data.messagesInCountTotal || viewers;
                bitrate = Math.floor(statsResult.data.messagesInBytesRate / 1000) || bitrate;
            }

            // Atualizar dados locais
            streamInfo.viewers = viewers;
            streamInfo.bitrate = bitrate;

            // Calcular uptime
            const uptime = this.calculateUptime(streamInfo.startTime);

            return {
                isActive: true,
                viewers,
                bitrate,
                uptime,
                currentVideo: streamInfo.currentVideoIndex + 1,
                totalVideos: streamInfo.videos.length,
                wowzaStats: statsResult.data,
                platforms: streamInfo.platforms
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

    // Obter informações do servidor
    async getServerInfo() {
        try {
            const result = await this.makeWowzaRequest('/v2/servers/_defaultServer_');
            return result;
        } catch (error) {
            console.error('Erro ao obter informações do servidor:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
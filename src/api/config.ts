import axios from 'axios';

export interface ChatModelParam {
    templateName: string
    id: string;
    name: string;
    interfaceType: string;
    host: string;
    path: string;
    apiKey: string;
    apiSecret: string;
    appId: string;
    model: string;
    temperature: number;
    maxTokens: number;
    active: boolean;
}

export interface ChatConfig {
    services: ChatModelParam[];
    templates: ChatModelParam[];
}

export function queryChatConfig() {
    return axios.post<ChatConfig>('/api/config/chat/queryChatConfig');
}

export function updateChatConfig(params: ChatModelParam) {
    return axios.post('/api/config/chat/updateChatConfig', params);
}

export function deleteChatConfig(params: ChatModelParam) {
    return axios.post('/api/config/chat/deleteChatConfig', params);
}


export function activeChatConfig(params: ChatModelParam) {
    return axios.post('/api/config/chat/activeChatConfig', params);
}

export interface AudioServerConfig {
    name: string;
    serverUrl: string;
    apiVersion: string;
}

export function queryAudioServerConfig() {
    return axios.post<AudioServerConfig[]>('/api/config/audioServer/queryAudioServerConfig');
}

export function updateAudioServerConfig(params: AudioServerConfig) {
    return axios.post('/api/config/audioServer/updateAudioServerConfig', params);
}

export interface VoiceTag {
    contentCategories: number;
    voicePersonalities: string;
}

export interface EdgeTtsVoice {
    name: string;
    shortName: string;
    gender: string;
    locale: string;
    suggestedCodec: string;
    friendlyName: string;
    status: string;
    voiceTag: VoiceTag[];
    url: string;
}

export interface LangText {
    enName: string;
    zhName: string;
    text: string;
}

export interface EdgeTtsConfig {
    langTexts: LangText[];
    voices: EdgeTtsVoice[];
}

export function queryEdgeTtsConfig() {
    return axios.post<EdgeTtsConfig>('/api/config/edge-tts/config');
}

export function updateEdgeTtsConfig(params: LangText) {
    return axios.post('/api/config/edge-tts/updateEdgeTtsConfig', params);
}

export function queryVoiceAudioUrl(params: string) {
    return axios.post<string>('/api/model/edge-tts/playAudio', {voice: params});
}
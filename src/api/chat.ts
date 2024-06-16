import axios from '@/axios/default-axios.ts';

export interface ChatModelConfig {
    id: string;
    templateName: string
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

export function list() {
    return axios.post<ChatModelConfig[]>('/api/chat/list');
}

export function templateList() {
    return axios.post<ChatModelConfig[]>('/api/chat/templateList');
}

export function updateModelChatConfig(params: ChatModelConfig) {
    return axios.post('/api/chat/updateModelChatConfig', params);
}

export function deleteModelChatConfig(params: ChatModelConfig) {
    return axios.post('/api/chat/deleteModelChatConfig', params);
}

export function activeModelChatConfig(params: ChatModelConfig) {
    return axios.post('/api/chat/activeModelChatConfig', params);
}

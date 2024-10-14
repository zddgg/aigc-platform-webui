import axios from "@/axios/default-axios.ts";

export interface TmServer {
    id: number;
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

export interface PromptTemplate {
    id?: number;
    templateGroup?: string;
    isDefault?: boolean;
    templateName?: string;
    systemPrompt?: string;
    userPrompt?: string;
    isPreset?: boolean;
}

export function queryTmServers() {
    return axios.post<TmServer[]>('/api/tmServer/list');
}

export function templateList() {
    return axios.post<TmServer[]>('/api/tmServer/templateList');
}

export function updateModelChatConfig(params: TmServer) {
    return axios.post('/api/tmServer/updateModelChatConfig', params);
}

export function deleteModelChatConfig(params: TmServer) {
    return axios.post('/api/tmServer/deleteModelChatConfig', params);
}

export function activeModelChatConfig(params: TmServer) {
    return axios.post('/api/tmServer/activeModelChatConfig', params);
}

export function queryPromptTemplates(params: PromptTemplate) {
    return axios.post<PromptTemplate[]>('/api/tmPromptTemplate/list', params);
}

export function editPromptTemplate(params: PromptTemplate) {
    return axios.post('/api/tmPromptTemplate/edit', params);
}

export function deletePromptTemplate(params: PromptTemplate) {
    return axios.post('/api/tmPromptTemplate/delete', params);
}

export function setDefaultPromptTemplate(params: PromptTemplate) {
    return axios.post('/api/tmPromptTemplate/setDefault', params);
}

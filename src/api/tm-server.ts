import axios from "@/axios/default-axios.ts";

export interface TmServer {
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

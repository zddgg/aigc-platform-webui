import axios from "@/axios/default-axios.ts";
import customAxios from "@/axios/custom-axios.ts";

export interface AmModelConfig {
  id: number;
  mcId: string;
  mcName: string;
  mcParamsJson: string;
  amType: string;
  mfId: string;
  paId: string;
  text: string;
  textLang: string;
  showFlag: boolean;
  avatar: string;
}

export function getByModelType(params: { modelType: string, showMode?: number }) {
  let {modelType, showMode = 1} = params;
  return axios.post<AmModelConfig[]>('/api/amModelConfig/getByModelType', {modelType, showMode});
}

export function createConfig(params: FormData) {
  return axios.post('/api/amModelConfig/createConfig', params);
}

export function updateConfig(params: AmModelConfig) {
  return axios.post('/api/amModelConfig/updateConfig', params);
}

export function deleteConfig(params: AmModelConfig) {
  return axios.post('/api/amModelConfig/deleteConfig', params);
}

export function createAudio(params: {
  amType: string;
  mfId?: string,
  paId?: string,
  mcParamsJson: string;
  text: string;
}) {
  return customAxios.post('/api/amModelConfig/createAudio', params, {responseType: 'blob'});
}

export function playOrCreateAudio(params: { mcId: string }) {
  return customAxios.post('/api/amModelConfig/playOrCreateAudio', params, {responseType: 'blob'});
}

export function syncEdgeTtsConfig() {
  return axios.post('/api/amModelConfig/syncEdgeTtsConfig');
}

export function updateEdgeTtsShowFlag(params: { [key: string]: boolean }) {
  return axios.post('/api/amModelConfig/updateEdgeTtsShowFlag', params);
}

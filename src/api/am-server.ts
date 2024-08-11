import axios from "@/axios/default-axios.ts";

export interface AmServer {
  name: string;
  host: string;
  path: string;
  apiVersion: string;
}

export function list() {
  return axios.post<AmServer[]>('/api/amServer/list');
}

export function updateConfig(params: AmServer) {
  return axios.post('/api/amServer/updateConfig', params);
}

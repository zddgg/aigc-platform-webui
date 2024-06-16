import axios from "@/axios/default-axios.ts";

export interface AudioServerConfig {
    name: string;
    host: string;
    path: string;
    apiVersion: string;
}

export function list() {
    return axios.post<AudioServerConfig[]>('/api/audioServerConfig/list');
}


export function updateConfig(params: AudioServerConfig) {
    return axios.post('/api/audioServerConfig/updateConfig', params);
}

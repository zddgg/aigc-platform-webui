import axios from "@/axios/default-axios.ts";
import customAxios from "@/axios/custom-axios.ts";

export interface ChatTtsConfig {
    id?: number;
    configId: string;
    configName: string;
    temperature: number;
    topP: number;
    topK: number;
    audioSeedInput: number;
    textSeedInput: number;
    refineTextFlag: boolean;
    refineTextParams: string;

    text: string;
    outputText: string;

    saveAudio: boolean;
    url: string;
}

export function configs() {
    return axios.post<ChatTtsConfig[]>('/api/chatTts/configs');
}

export function deleteConfig(params: ChatTtsConfig) {
    return axios.post('/api/chatTts/deleteConfig', params);
}

export function createConfig(params: FormData) {
    return axios.post('/api/chatTts/createConfig', params);
}

export function playAudio(params: ChatTtsConfig) {
    return customAxios.post('/api/chatTts/playAudio', params, {responseType: 'blob'});
}
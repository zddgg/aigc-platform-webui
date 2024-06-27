import axios from '@/axios/default-axios.ts';
import customAxios from "@/axios/custom-axios.ts";

export interface FishSpeechConfig {
    id?: number;

    configId?: string;
    configName: string;

    modelId: string;
    moodAudioId: string;

    topP: number;
    temperature: number;
    repetitionPenalty: number;

    text: string;

    saveAudio: boolean;
    url?: string;

    refAudioCascaderPath: string[]
}

export interface FishSpeechModel {
    id: number;
    modelId: string;
    modelGroup: string;
    modelName: string;
    ckpt: string;
    pth: string;
}

export function models() {
    return axios.post<FishSpeechModel[]>('/api/fishSpeech/modelList');
}

export function configs() {
    return axios.post<FishSpeechConfig[]>('/api/fishSpeech/configs');
}

export function playAudio(params: FishSpeechConfig) {
    return customAxios.post('/api/fishSpeech/playAudio', params, {responseType: 'blob'});
}

export function createConfig(params: FormData) {
    return axios.post('/api/fishSpeech/createConfig', params);
}

export function deleteConfig(params: FishSpeechConfig) {
    return axios.post('/api/fishSpeech/deleteConfig', params);
}

export function refreshCache() {
    return axios.post('/api/fishSpeech/refreshCache');
}
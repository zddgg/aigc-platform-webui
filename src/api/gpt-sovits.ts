import axios from '@/axios/default-axios.ts';
import customAxios from "@/axios/custom-axios.ts";

export interface GptSovitsConfig {
    id?: number;

    configId?: string;
    configName: string;

    modelId: string;
    moodAudioId: string;

    topP: number;
    topK: number;
    temperature: number;
    repetitionPenalty: number;
    batchSize: number;
    parallelInfer: boolean;
    splitBucket: boolean;
    seed: number;
    textSplitMethod: string;
    fragmentInterval: number;
    speedFactor: number;

    text: string;

    saveAudio: boolean;
    url?: string;

    refAudioCascaderPath: string[]
}

export interface GptSovitsModel {
    id: number;
    modelId: string;
    modelGroup: string;
    modelName: string;
    ckpt: string;
    pth: string;
}

export function models() {
    return axios.post<GptSovitsModel[]>('/api/gptSovits/modelList');
}

export function configs() {
    return axios.post<GptSovitsConfig[]>('/api/gptSovits/configs');
}

export function playAudio(params: GptSovitsConfig) {
    return customAxios.post('/api/gptSovits/playAudio', params, {responseType: 'blob'});
}

export function createConfig(params: FormData) {
    return axios.post('/api/gptSovits/createConfig', params);
}

export function deleteConfig(params: GptSovitsConfig) {
    return axios.post('/api/gptSovits/deleteConfig', params);
}

export function refreshCache() {
    return axios.post('/api/gptSovits/refreshCache');
}
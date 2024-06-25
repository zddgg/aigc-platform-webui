import axios from "@/axios/default-axios.ts";
import customAxios from "@/axios/custom-axios.ts";

export interface VoiceTag {
    contentCategories: number;
    voicePersonalities: string;
}

export interface EdgeTtsConfig {
    shortName: string;
    gender: string;
    locale: string;
    suggestedCodec: string;
    friendlyName: string;
    status: string;
    voiceTag: VoiceTag[];

    url: string;
    text: string;
    avatar: string;
}

export interface EdgeTtsSetting {
    enName: string;
    zhName: string;
    text: string;
    showFlag: boolean;
}

export function configs() {
    return axios.post<EdgeTtsConfig[]>('/api/edgeTts/configs');
}

export function settings() {
    return axios.post<EdgeTtsSetting[]>('/api/edgeTts/settings');
}

export function updateSetting(params: EdgeTtsSetting) {
    return axios.post('/api/edgeTts/updateSetting', params);
}

export function playOrCreateAudio(params: string) {
    return axios.post<string>('/api/edgeTts/playOrCreateAudio', {voice: params});
}

export function playAudio(params: EdgeTtsConfig) {
    return customAxios.post('/api/edgeTts/playAudio', params, {responseType: 'blob'});
}

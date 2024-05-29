import axios from "axios";
import {CommonModelConfig, Model} from "@/api/model.ts";

export function updateServerUrl(params: string) {
    return axios.post('/api/model/fish-speech/updateServerUrl', {serverUrl: params});
}

export function queryModels() {
    return axios.post<Model[]>('/api/model/fish-speech/queryModels');
}

export function queryConfig() {
    return axios.post<CommonModelConfig>('/api/model/fish-speech/queryConfig');
}
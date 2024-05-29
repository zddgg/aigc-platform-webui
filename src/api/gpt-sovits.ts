import axios from "axios";
import {Model} from "@/api/model.ts";

export function updateServerUrl(params: string) {
    return axios.post('/api/model/gpt-sovits/updateServerUrl', {serverUrl: params});
}

export function queryModels() {
    return axios.post<Model[]>('/api/model/gpt-sovits/queryModels');
}
import axios from '@/axios/default-axios.ts';
import {Model} from "@/api/model.ts";

export function queryModels() {
    return axios.post<Model[]>('/api/model/fish-speech/queryModels');
}
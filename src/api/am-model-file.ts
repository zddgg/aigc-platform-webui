import axios from "@/axios/default-axios.ts";

export interface AmModelFile {
  id: number;
  mfId: string;
  amType: string;
  mfGroup: string;
  mfRole: string;
  mfJson: string;
}

export function refreshCache(params: { modelType: string }) {
  return axios.post('/api/amModelFile/refreshCache', params);
}

export function getByModelType(params: { modelType: string }) {
  return axios.post<AmModelFile[]>('/api/amModelFile/getByModelType', params);
}

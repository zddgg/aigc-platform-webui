import axios from "@/axios/default-axios.ts";

export interface GlobalSetting {
  subtitleOptimize: boolean;
}

export function getGlobalSetting() {
  return axios.post<GlobalSetting>('/api/globalSetting/getGlobalSetting');
}

export function updateGlobalSetting(params: GlobalSetting) {
  return axios.post<GlobalSetting>('/api/globalSetting/updateGlobalSetting', params);
}

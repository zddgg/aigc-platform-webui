import axios from "@/axios/default-axios.ts";

export interface AppInfo {
  currentVersion: string;
  latestVersion: string;
}

export function getAppInfoData() {
  return axios.post<AppInfo>('/api/app/appInfo');
}

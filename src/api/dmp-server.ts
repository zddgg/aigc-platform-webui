import axios from "@/axios/dmp-axios.ts";
import {AppInfo} from "@/api/app-info.ts";

export interface AppAccessLog {
  appId: string;
  visitorId: string;
  appVersion: string;
}

export function appLog(params: AppAccessLog) {
  return axios.post<AppInfo>('/dmp/app/log', params);
}
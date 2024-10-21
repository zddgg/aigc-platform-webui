import axios from "@/axios/dmp-axios.ts";

export interface AppAccessLog {
  appId: string;
  visitorId: string;
}

export function appLog(params: AppAccessLog) {
  return axios.post('/dmp/app/log', params);
}
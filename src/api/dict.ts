import axios from "@/axios/default-axios.ts";

export interface LangDict {
  enName: string;
  zhName: string;
}

export function queryLangDicts() {
  return axios.post<LangDict[]>('/api/dict/lang');
}
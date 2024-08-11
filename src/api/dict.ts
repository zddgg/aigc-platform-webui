import axios from "@/axios/default-axios.ts";

export interface LangDict {
  enName: string;
  zhName: string;
  text: string;
}

export function queryLangDicts() {
  return axios.post<LangDict[]>('/api/dict/lang');
}

export function editLangDict(params: LangDict) {
  return axios.post('/api/dict/lang/edit', params);
}

export function langDictSort(params: LangDict[]) {
  return axios.post('/api/dict/lang/sort', params);
}
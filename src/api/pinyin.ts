import axios from '@/axios/default-axios.ts';
import {PinyinState} from "@/store/pinyin/types.ts";

export function getPinyinData() {
  return axios.post<PinyinState>('/api/pinyin/getPinyinData');
}

export function refreshCache() {
  return axios.post('/api/pinyin/refreshCache');
}
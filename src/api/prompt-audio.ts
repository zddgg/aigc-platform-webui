import axios from "@/axios/default-axios.ts";

export interface PaAudio {
  id: number;
  paId: string;
  paAudio: string;
  paAudioText: string;
  paAudioLang: string;
  paAudioTags: string[];
  audioUrl: string;
}

export interface PaMood {
  paMood: string;
  paMoodAvatar: string;
  paAudios: PaAudio[];
  currentAudio: PaAudio;
}

export interface PromptAudio {
  paGroup: string;
  paRole: string;
  paRoleGender: string;
  paRoleAge: string;
  paRoleLang: string;
  paRoleTags: string[];
  paRoleAvatar: string;
  paMoods: PaMood[];
}

export function refreshCache() {
  return axios.post('/api/amPromptAudio/refreshCache');
}

export function queryPromptAudios() {
  return axios.post<PromptAudio[]>('/api/amPromptAudio/queryPromptAudios');
}

export function updatePromptAudio(params: PromptAudio) {
  return axios.post('/api/amPromptAudio/updatePromptAudio', params);
}

export interface PromptAudioSort {
  group: string;
  sortOrder: number;
  showFlag: boolean;
}

export function queryPromptAudioSorts() {
  return axios.post<PromptAudioSort[]>('/api/amPromptAudio/queryPromptAudioSorts');
}

export function updatePromptAudioSorts(params: PromptAudioSort[]) {
  return axios.post('/api/amPromptAudio/updatePromptAudioSorts', params);
}
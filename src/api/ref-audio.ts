import axios from '@/axios/default-axios.ts';

export interface MoodAudio {
    id: number;
    name: string;
    text: string;
    tags: string[];
    url: string;
}

export interface Mood {
    id: number;
    name: string;
    moodAudios: MoodAudio[];
    avatar: string;
    currentMoodAudio: MoodAudio;
}

export interface RefAudio {
    modelType: string;
    id: number;
    name: string;
    group: string;
    gender: string;
    ageGroup: string;
    language: string;
    moods: Mood[];
    tags: string[];
    avatar: string;
}

export function queryRefAudios() {
    return axios.post<RefAudio[]>('/api/model/refAudio/queryRefAudios');
}

export function updateRefAudio(params: RefAudio) {
    return axios.post('/api/model/refAudio/updateRefAudio', params);
}

export interface RefAudioSort {
    group: string;
    sortOrder: number;
    showFlag: boolean;
}

export function queryRefAudioSort() {
    return axios.post<RefAudioSort[]>('/api/model/refAudio/queryRefAudioSort');
}

export function updateRefAudioSort(params: RefAudioSort[]) {
    return axios.post('/api/model/refAudio/updateRefAudioSort', params);
}
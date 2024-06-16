import axios from '@/axios/default-axios.ts';

export interface MoodAudio {
    id: string;
    name: string;
    text: string;
    tags: string[];
    audioUrl: string;
}

export interface Mood {
    id: number;
    name: string;
    moodAudios: MoodAudio[];
    avatarUrl: string;
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
    avatarUrl: string;
}

export interface RefAudioEntity {
    refAudioId: string;
    audioGroup: string;
    audioName: string;
    moodName: string;
    moodAudioName: string;
    moodAudioText: string;
}

export function queryRefAudios() {
    return axios.post<RefAudio[]>('/api/refAudio/refAudioList');
}

export function updateRefAudio(params: RefAudio) {
    return axios.post('/api/refAudio/updateRefAudio', params);
}

export function refreshCache() {
    return axios.post('/api/refAudio/refreshCache');
}

export interface RefAudioSort {
    group: string;
    sortOrder: number;
    showFlag: boolean;
}

export function queryGroupSorts() {
    return axios.post<RefAudioSort[]>('/api/refAudio/queryGroupSorts');
}

export function updateRefAudioSorts(params: RefAudioSort[]) {
    return axios.post('/api/refAudio/updateRefAudioSorts', params);
}
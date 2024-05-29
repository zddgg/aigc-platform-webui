import axios from 'axios';

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

export interface ModelSelect {
    modelType: string;
    model: string[]
    audio: string[];
}

export function queryRefAudios() {
    return axios.post<RefAudio[]>('/api/model/refAudio/queryRefAudios');
}

export function updateRefAudio(params: RefAudio) {
    return axios.post('/api/model/refAudio/updateRefAudio', params);
}
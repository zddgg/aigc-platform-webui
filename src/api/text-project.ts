import axios from '@/axios/default-axios.ts';

export interface TextProject {
    id: number;
    projectId: string;
    projectName: string;
    chapterCount: number;
}

export function createProject(params: FormData) {
    return axios.post('/api/textProject/create', params);
}


export function list() {
    return axios.post<TextProject[]>('/api/textProject/list');
}

export function tmpChapterSplit(params: { projectId: string, chapterPattern: string, dialoguePattern: string }) {
    return axios.post<string[]>('/api/textProject/tmpChapterSplit', params);
}

export function chapterSplit(params: { projectId: string, chapterPattern: string, dialoguePattern: string }) {
    return axios.post('/api/textProject/chapterSplit', params);
}

export function deleteProject(params: TextProject) {
    return axios.post('/api/textProject/delete', params);
}

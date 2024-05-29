import axios from 'axios';
import {FetchStream, IFetchStreamOptions} from "@/api/stream.ts";
import {ModelSelect} from "@/api/ref-audio.ts";

export interface ProjectParam {
    project: string;
}

export function createProject(params: FormData) {
    return axios.post('/api/text/project/create', params);
}

export function deleteProject(params: ProjectParam) {
    return axios.post('/api/text/project/delete', params);
}

export function projectList() {
    return axios.post<string[]>('/api/text/project/list');
}

export interface ChapterSplit extends ProjectParam {
    chapterPattern: string;
    linesPattern: string;
}

export interface ChapterParam extends ProjectParam {
    chapter: string;
}

export function tmpChapterSplit(params: ChapterSplit) {
    return axios.post<string[]>('/api/text/chapter/tmpChapterSplit', params);
}

export function chapterSplit(params: ChapterSplit) {
    return axios.post<string[]>('/api/text/chapter/chapterSplit', params);
}

export function queryChapters(params: ProjectParam) {
    return axios.post<string[]>('/api/text/chapter/queryChapters', params);
}

export interface Role extends ModelSelect {
    role: string;
    gender: string;
    ageGroup: string;
    backup: string;
}

export interface ChapterInfo extends Role {
    p: number;
    s: number;
    text: string;
    linesFlag: boolean;
    audioUrl: string;
}

export function queryChapterInfo(params: ChapterParam) {
    return axios.post<ChapterInfo[]>('/api/text/chapter/queryChapterInfo', params);
}

export function linesParse(params: ChapterParam) {
    return axios.post('/api/text/chapter/linesParse', params);
}

export interface ProjectConfig {
    chapterTitlePattern: string;
}

export interface ChapterConfig {
    linesModifiers: string[];
}

export function aiInference(url: string,
                            params: Object,
                            onMessage: (data: string[], index: number) => void,
                            onDone?: () => void,
                            onError?: (response: Response) => void,
                            onTimeout?: () => void) {
    const fetchOptions: IFetchStreamOptions = {
        url,
        requestInit: {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        },
        onMessage: onMessage,
        onDone: onDone,
        onError: onError,
        onTimeout: onTimeout,
    };
    const fetchStream = new FetchStream(fetchOptions);

    fetchStream.startRequest();
}

export function queryRoles(params: ChapterParam) {
    return axios.post<Role[]>('/api/text/chapter/queryRoles', params);
}

export function queryCommonRoles(params: ProjectParam) {
    return axios.post<Role[]>('/api/text/chapter/queryCommonRoles', params);
}

export function createCommonRole(params: { chapter: ProjectParam, role: Role }) {
    return axios.post('/api/text/chapter/createCommonRole', params);
}

export function deleteCommonRole(params: { chapter: ProjectParam, role: Role }) {
    return axios.post('/api/text/chapter/deleteCommonRole', params);
}

export function textModelChange(params: { chapter: ChapterParam, chapterInfo: ChapterInfo }) {
    return axios.post<Role[]>('/api/text/chapter/textModelChange', params);
}

export function roleModelChange(params: { chapter: ChapterParam, role: Role }) {
    return axios.post('/api/text/chapter/roleModelChange', params);
}

export function commonRoleModelChange(params: { chapter: ProjectParam, role: Role }) {
    return axios.post('/api/text/chapter/commonRoleModelChange', params);
}

export function textRoleChange(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
    loadModel: boolean,
}) {
    return axios.post<Role[]>('/api/text/chapter/textRoleChange', params);
}

export function roleRename(params: {
    chapter: ChapterParam,
    role: string,
    newRole: string,
    roleType: string,
}) {
    return axios.post('/api/text/chapter/roleRename', params);
}

export function roleCombine(params: {
    chapter: ChapterParam,
    role: string,
    newRole: string,
    roleType: string,
}) {
    return axios.post('/api/text/chapter/roleCombine', params);
}

export function updateChapterText(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo
}) {
    return axios.post('/api/text/chapter/updateChapterText', params);
}

export function startCreateAudio(params: { actionType: string } & ChapterParam) {
    return axios.post('/api/text/chapter/startCreateAudio', params);
}

export function createAudio(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/createAudio', params);
}
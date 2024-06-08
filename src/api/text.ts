import axios from '@/axios/default-axios.ts';
import {FetchStream, IFetchStreamOptions} from "@/api/stream.ts";
import {ModelConfig} from "@/api/model.ts";

export interface ProjectParam {
    project: string;
    chapterNum?: string;
}

export function createProject(params: FormData) {
    return axios.post('/api/text/project/create', params);
}

export function deleteProject(params: ProjectParam) {
    return axios.post('/api/text/project/delete', params);
}

export function projectList() {
    return axios.post<ProjectParam[]>('/api/text/project/list');
}

export interface ChapterParam extends ProjectParam {
    chapter?: string;
}

export interface Chapter extends ChapterParam {
    chapter: string;
    textNum?: number;
    roleNum?: number;
    stage?: string;
}

export interface ChapterSplit extends ChapterParam {
    chapterPattern?: string;
    linesPattern?: string;
    textContent?: string;
}

export function tmpChapterSplit(params: ChapterSplit) {
    return axios.post<string[]>('/api/text/chapter/tmpChapterSplit', params);
}

export function chapterSplit(params: ChapterSplit) {
    return axios.post<string[]>('/api/text/chapter/chapterSplit', params);
}

export function queryChapters(params: ProjectParam) {
    return axios.post<Chapter[]>('/api/text/chapter/queryChapters', params);
}

export function queryChapterText(params: ChapterParam) {
    return axios.post<string>('/api/text/chapter/queryChapterText', params);
}

export function tmpLinesParse(params: ChapterSplit) {
    return axios.post<string[]>('/api/text/chapter/tmpLinesParse', params);
}

export function linesParse(params: ChapterSplit) {
    return axios.post('/api/text/chapter/linesParse', params);
}

export interface Role extends ModelConfig {
    role: string;
    gender: string;
    ageGroup: string;
    roleCount: number;
}

export interface ChapterInfo extends Role {
    index: string;
    p: number;
    s: number;
    text: string;
    linesFlag: boolean;

    volume: number;
    speed: number;
    interval: number;
    export: boolean;
    audioUrl: string;
}

export function queryChapterInfo(params: ChapterParam) {
    return axios.post<ChapterInfo[]>('/api/text/chapter/queryChapterInfo', params);
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

export function checkAiResult(params: ChapterParam) {
    return axios.post<boolean>('/api/text/chapter/checkAiResult', params);
}

export function loadAiResult(params: ChapterParam) {
    return axios.post<boolean>('/api/text/chapter/loadAiResult', params);
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
    return axios.post<number>('/api/text/chapter/startCreateAudio', params);
}

export function createAudio(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/createAudio', params);
}

export function stopCreateAudio() {
    return axios.post('/api/text/chapter/stopCreateAudio');
}

export function updateVolume(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/updateVolume', params);
}

export function updateSpeed(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/updateSpeed', params);
}

export function updateInterval(params: {
    chapter: ChapterParam,
    chapterInfo: ChapterInfo,
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/updateInterval', params);
}

export function updateControls(params: {
    enableVolume: boolean,
    volume: number,
    enableSpeed: boolean,
    speed: number,
    enableInterval: boolean,
    interval: number,
} & ChapterParam) {
    return axios.post<ChapterInfo>('/api/text/chapter/updateControls', params);
}

export function chapterExpose(params: {
    chapter: ChapterParam,
    indexes: string[],
    combineAudio: boolean;
    subtitle: boolean;
}) {
    return axios.post<ChapterInfo>('/api/text/chapter/chapterExpose', params);
}
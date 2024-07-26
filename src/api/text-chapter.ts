import axios from '@/axios/default-axios.ts';
import {AudioModelConfig} from "@/api/model.ts";
import {FetchStream, IFetchStreamOptions} from "@/api/stream.ts";
import {Pagination, PaginationResp} from "@/types/global.ts";

export interface TextChapter {
  id: number;
  projectId: string;
  projectName: string;
  chapterId: string;
  chapterName: string;
  content: string;
  dialoguePattern: string;
  sortOrder: number;
  textNum: number;
  roleNum: number;
  stage: string;
}

export interface TextChapterPage extends Pagination {
  projectId: string;
}

export function pageChapters(params: TextChapterPage) {
  return axios.post<PaginationResp<TextChapter>>('/api/textChapter/pageChapters', params);
}

export function chapters4Sort(params: { projectId: string }) {
  return axios.post<TextChapter[]>('/api/textChapter/chapters4Sort', params);
}

export function deleteChapter(params: TextChapter) {
  return axios.post('/api/textChapter/deleteChapter', params);
}

export function getTextChapter(params: { projectId: string, chapterId: string }) {
  return axios.post<TextChapter>('/api/textChapter/getTextChapter', params);
}

export interface TextRole extends AudioModelConfig {
  projectId: string;
  chapterId?: string;
  role: string;
  gender: string;
  ageGroup: string;
  roleCount: number;
  cover: boolean;
}

export interface PhoneticAnno {
  type: string;
  index: number,
  pinyin: string
}

export interface ChapterInfo extends TextRole {
  id: number;
  index: string;
  projectId: string;
  chapterId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  text: string;
  textLang: string;
  dialogueFlag: boolean;
  audioVolume: number;
  audioSpeed: number;
  nextAudioInterval: number;
  audioState: number;
  audioLength: number;
  audioExportFlag: boolean;
  sortOrder: number;
  phoneticInfo: string;
  audioInstruct: string;

  audioUrl: string;
}

export function tmpDialogueParse(params: TextChapter) {
  return axios.post<ChapterInfo[]>('/api/textChapter/tmpDialogueParse', params);
}

export function chapterEdit(params: TextChapter) {
  return axios.post('/api/textChapter/chapterEdit', params);
}

export function chapterAdd(params: {
  textChapter: TextChapter
  sortChapters: TextChapter[]
}) {
  return axios.post('/api/textChapter/chapterAdd', params);
}

export function chapterSort(params: TextChapter[]) {
  return axios.post('/api/textChapter/chapterSort', params);
}

export function chapterInfos(params: { projectId: string, chapterId: string }) {
  return axios.post<ChapterInfo[]>('/api/textChapter/chapterInfos', params);
}

export function roles(params: { projectId: string, chapterId: string }) {
  return axios.post<TextRole[]>('/api/textChapter/roles', params);
}

export function updateRoleName(params: TextRole) {
  return axios.post('/api/textChapter/updateRoleName', params);
}

export function updateRole(params: TextRole) {
  return axios.post('/api/textChapter/updateRole', params);
}

export function roleCombine(params: {
  projectId: string,
  chapterId: string,
  fromRoleName: string;
  toRoleName: string;
}) {
  return axios.post('/api/textChapter/roleCombine', params);
}

export function textRoleChange(params: {
  projectId: string,
  chapterId: string,
  chapterInfoId: number;
  formRoleName: string;
  fromRoleType: string;
  changeModel: boolean;
}) {
  return axios.post('/api/textChapter/textRoleChange', params);
}

export function saveToCommonRole(params: TextRole) {
  return axios.post('/api/textChapter/saveToCommonRole', params);
}

export function commonRoles(params: { projectId: string }) {
  return axios.post<TextRole[]>('/api/textChapter/commonRoles', params);
}

export function createCommonRole(params: TextRole) {
  return axios.post('/api/textChapter/createCommonRole', params);
}

export function updateCommonRole(params: TextRole) {
  return axios.post('/api/textChapter/updateCommonRole', params);
}

export function deleteCommonRole(params: TextRole) {
  return axios.post('/api/textChapter/deleteCommonRole', params);
}

export function roleInference(url: string,
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

export function checkRoleInference(params: { projectId: string, chapterId: string }) {
  return axios.post<boolean>('/api/textChapter/checkRoleInference', params);
}

export function loadRoleInference(params: { projectId: string, chapterId: string }) {
  return axios.post('/api/textChapter/loadRoleInference', params);
}

export function audioModelChange(params: ChapterInfo) {
  return axios.post('/api/textChapter/audioModelChange', params);
}

export function updateVolume(params: ChapterInfo) {
  return axios.post('/api/textChapter/updateVolume', params);
}

export function updateSpeed(params: ChapterInfo) {
  return axios.post('/api/textChapter/updateSpeed', params);
}

export function updateInterval(params: ChapterInfo) {
  return axios.post('/api/textChapter/updateInterval', params);
}

export function updateControls(params: {
  projectId: string,
  chapterId: string,
  enableVolume: boolean,
  volume: number,
  enableSpeed: boolean,
  speed: number,
  enableInterval: boolean,
  interval: number,
}) {
  return axios.post('/api/textChapter/updateControls', params);
}

export function updateChapterText(params: ChapterInfo) {
  return axios.post('/api/textChapter/updateChapterText', params);
}

export function createAudio(params: ChapterInfo) {
  return axios.post<string[]>('/api/textChapter/createAudio', params);
}

export function startCreateAudio(params: {
  projectId: string,
  chapterId: string,
  actionType: string
}) {
  return axios.post<string[]>('/api/textChapter/startCreateAudio', params);
}

export function stopCreateAudio() {
  return axios.post('/api/textChapter/stopCreateAudio');
}

export function chapterExpose(params: {
  projectId: string,
  chapterId: string,
  indexes: string[],
  combineAudio: boolean;
  subtitle: boolean;
}) {
  return axios.post<ChapterInfo>('/api/textChapter/chapterExpose', params);
}

export function deleteChapterInfo(params: ChapterInfo) {
  return axios.post('/api/textChapter/deleteChapterInfo', params);
}

export function addChapterInfo(params: ChapterInfo) {
  return axios.post('/api/textChapter/addChapterInfo', params);
}

export function chapterInfoSort(params: ChapterInfo[]) {
  return axios.post('/api/textChapter/chapterInfoSort', params);
}

export function addPhoneticAnno(params: PhoneticAnno & {chapterInfoId: number}) {
  return axios.post('/api/textChapter/addPhoneticAnno', params);
}

export function removePhoneticAnno(params: PhoneticAnno & {chapterInfoId: number}) {
  return axios.post('/api/textChapter/removePhoneticAnno', params);
}
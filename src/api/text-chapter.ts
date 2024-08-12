import axios from '@/axios/default-axios.ts';
import {AudioModelInfo, AudioModelInfoKey, AudioRoleInfo} from "@/api/model.ts";
import {FetchStream, IFetchStreamOptions} from "@/api/stream.ts";
import {Pagination, PaginationResp} from "@/types/global.ts";
import customAxios from "@/axios/custom-axios.ts";

export interface TextContentConfig {
  edit: boolean;
  showDialogue: boolean;
}

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
  audioTaskState: number;
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

export function getTextChapter(params: ChapterParam) {
  return axios.post<TextChapter>('/api/textChapter/getTextChapter', params);
}

export interface TextRole extends AudioRoleInfo, AudioModelInfo {
  id: number;
  projectId: string;
  chapterId?: string;
  roleCount: number;
  coverCommonRole: boolean;
}

export interface PolyphonicInfo {
  index: number,
  markup: string
}

export interface TextMarkupInfo {
  polyphonicInfos: PolyphonicInfo[]
}

export interface ChapterInfo extends AudioRoleInfo {
  id: number;
  index: string;
  projectId: string;
  chapterId: string;
  paraIndex: number;
  sentIndex: number;
  textId: string;
  text: string;
  textLang: string;
  textSort: number;
  dialogueFlag: boolean;
  audioVolume: number;
  audioSpeed: number;
  audioInterval: number;
  audioLength: number;
  audioTaskState: number;
  audioFiles: string;
  textMarkupInfo: TextMarkupInfo;
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

export function updateRole(params: TextRole) {
  return axios.post('/api/textChapter/updateRole', params);
}

export function updateRoleModel(params: UpdateModelInfo) {
  return axios.post('/api/textChapter/updateRoleModel', params);
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
  chapterInfoIds: number[];
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

export function updateCommonRole(params: UpdateModelInfo) {
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

export interface ChapterParam {
  projectId?: string;
  chapterId?: string;
}

export interface UpdateModelInfo extends ChapterParam, AudioModelInfoKey {
  ids?: number[]
}

export function audioModelChange(params: UpdateModelInfo) {
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
  chapterInfoIds: number[],
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
  chapterInfoIds: number[],
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

export function addPolyphonicInfo(params: PolyphonicInfo & { chapterInfoId: number }) {
  return axios.post('/api/textChapter/addPolyphonicInfo', params);
}

export function removePolyphonicInfo(params: PolyphonicInfo & { chapterInfoId: number }) {
  return axios.post('/api/textChapter/removePolyphonicInfo', params);
}

export function playAudio(params: ChapterInfo) {
  return customAxios.post('/api/textChapter/playAudio', params, {responseType: 'blob'});
}

export function chapterCondition(params: ChapterParam) {
  return axios.post<ChapterInfo[]>('/api/textChapter/chapterCondition', params);
}

export function getChapterAudio(params: ChapterParam) {
  return customAxios.post('/api/textChapter/getChapterAudio', params, {responseType: 'blob'});
}

export interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

export function getChapterSubtitle(params: ChapterParam) {
  return axios.post<Subtitle[]>('/api/textChapter/getChapterSubtitle', params);
}
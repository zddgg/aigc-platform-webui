import axios from '@/axios/default-axios.ts';
import {ChapterInfo} from "@/api/text-chapter.ts";

export interface TextProject {
  id: number;
  projectId: string;
  projectName: string;
  projectType: string;
  chapterCount: number;
}

export function createProject(params: FormData) {
  return axios.post('/api/textProject/createProject', params);
}

export function createFormatTextProject(params: {
  projectName: string;
  projectType: string;
  chapterInfos: ChapterInfo[]
}) {
  return axios.post('/api/textProject/createFormatTextProject', params);
}

export function projectList() {
  return axios.post<TextProject[]>('/api/textProject/projectList');
}

export function getTextProject(params: { projectId: string }) {
  return axios.post<TextProject>('/api/textProject/getTextProject', params);
}

export function tmpChapterSplit(params: { projectId: string, chapterPattern: string, dialoguePattern: string }) {
  return axios.post<string[]>('/api/textProject/tmpChapterSplit', params);
}

export function chapterSplit(params: { projectId: string, chapterPattern: string, dialoguePattern: string }) {
  return axios.post('/api/textProject/chapterSplit', params);
}

export function deleteProject(params: TextProject) {
  return axios.post('/api/textProject/deleteProject', params);
}

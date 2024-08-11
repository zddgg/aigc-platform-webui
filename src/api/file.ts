import axios from "@/axios/default-axios.ts";

export interface OpenFolderParams {
  projectId: string;
  chapterId: string;
  op: string;
}

export function openFolder(params: OpenFolderParams) {
  return axios.post('/api/files/openFolder', params);
}

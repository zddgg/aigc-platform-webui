export interface Pagination {
  current: number;
  pageSize: number;
  total?: number;
  pages?: number;
}

export interface PaginationResp<T> {
  current: number;
  pageSize: number;
  total: number;
  pages: number;
  records: T[];
}

export interface HttpResponse<T = unknown> {
  code: string;
  msg: string;
  data: T;
}

export enum AudioTaskState {
  init,
  process,
  created,
  modified,
  combined
}

export enum AudioTaskEvent {
  audio_combine = 'audio_combine'
}

export enum TextProjectType {
  long_text = 'long_text',
  short_text = 'short_text',
  format_text = 'format_text',
}
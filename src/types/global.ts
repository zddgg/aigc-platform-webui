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
  modified,
  created,
  combined
}

export enum AudioTaskEvent {
  audio_combine = 'audio_combine',
  audio_generate_result = 'audio_generate_result',
  audio_generate_summary = 'audio_generate_summary',
  chapter_reload = 'chapter_reload',
}

export enum TextProjectType {
  long_text = 'long_text',
  short_text = 'short_text',
  format_text = 'format_text',
}

export enum WsEventType {
  audio_generate_result = 'audio_generate_result',
  audio_generate_summary = 'audio_generate_summary',
  chapter_reload = 'chapter_reload',
}
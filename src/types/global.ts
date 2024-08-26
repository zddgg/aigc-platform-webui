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

export enum EventTypes {
  chapter_refresh = 'chapter_refresh',
  chapter_title_refresh = 'chapter_title_refresh',
  chapter_info_refresh = 'chapter_info_refresh',
  chapter_role_refresh = 'chapter_role_refresh',

  audio_generate_result = 'audio_generate_result',
  audio_generate_summary = 'audio_generate_summary',
}

export enum TextProjectType {
  long_text = 'long_text',
  short_text = 'short_text',
  format_text = 'format_text',
}
import {EventTypes} from "@/types/global.ts";
import emitter from "@/mitt";

export interface ITextWebSocketService {
  connect(project: string): void;

  addProjectHandler(key: string, handler: (data: any) => void): void;

  addChapterHandler(key: string, handler: (data: any) => void): void;

  disconnect(): void;
}

class TextWebsocketService implements ITextWebSocketService {
  private socket: WebSocket | null;
  private projectHandlers: Map<string, (data: any) => void>;
  private chapterHandlers: Map<string, (data: any) => void>;
  private reconnectInterval: number;

  constructor() {
    this.socket = null;
    this.projectHandlers = new Map();
    this.chapterHandlers = new Map();
    this.reconnectInterval = 5000; // 5秒重连间隔
  }

  connect(projectId: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.socket = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/text?projectId=${projectId}`);

      this.socket.onopen = () => {
        console.log('WebSocket connection opened.');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data)

        if (!!data) {
          const types = (data.type as string).split(',').map((item) => item.trim());
          if (types.includes(EventTypes.audio_generate_result)) {
            emitter?.emit(EventTypes.audio_generate_result, data);
          }
          if (types.includes(EventTypes.audio_generate_summary)) {
            emitter?.emit(EventTypes.audio_generate_summary, data);
          }
          if (types.includes(EventTypes.chapter_title_refresh)) {
            emitter?.emit(EventTypes.chapter_title_refresh, data);
          }
          if (types.includes(EventTypes.chapter_info_refresh)) {
            emitter?.emit(EventTypes.chapter_info_refresh, data);
          }
          if (types.includes(EventTypes.chapter_role_refresh)) {
            emitter?.emit(EventTypes.chapter_role_refresh, data);
          }
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed.');
        // 断线重连
        setTimeout(() => {
          console.log('Reconnecting WebSocket...');
          this.connect(projectId);
        }, this.reconnectInterval);
      };

      this.socket.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };
    }
  }

  addProjectHandler(key: string, handler: (data: any) => void) {
    if (key) {
      this.projectHandlers.set(key, handler);
    }
  }

  addChapterHandler(key: string, handler: (data: any) => void) {
    if (key) {
      this.chapterHandlers.set(key, handler);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.projectHandlers.clear();
    this.chapterHandlers.clear();
  }
}

export function createTextWebsocketService() {
  return new TextWebsocketService();
}
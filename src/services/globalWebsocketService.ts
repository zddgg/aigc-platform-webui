import {Notification} from "@arco-design/web-vue";

export interface IGlobalWebsocketService {
    connect(project: string): void;

    addEventHandler(key: string, handler: () => void): void;

    disconnect(): void;
}

class GlobalWebsocketService implements IGlobalWebsocketService {
    private socket: WebSocket | null;
    private eventHandlers: Map<string, () => void>;
    private reconnectInterval: number;

    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.reconnectInterval = 5000; // 5秒重连间隔
    }

    connect() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.socket = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/global`);

            this.socket.onopen = () => {
                console.log('GlobalWebsocket connection opened.');
            };

            this.socket.onmessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                if (data.type === 'message') {
                    if (data.state === 'error') {
                        Notification.error({
                            title: data.title ?? `系统异常`,
                            content: data.message,
                            position: 'topRight',
                        })
                    }
                    if (data.state === 'success') {
                        Notification.success({
                            title: data.title,
                            content: data.message,
                            position: 'topRight',
                        })
                    }
                }
                if (data.type === 'event') {
                    const handler = this.eventHandlers.get(data.event);
                    if (handler) {
                        handler();
                    }
                }
            };

            this.socket.onclose = () => {
                console.log('GlobalWebsocket connection closed.');
                // 断线重连
                setTimeout(() => {
                    console.log('Reconnecting GlobalWebsocket...');
                    this.connect();
                }, this.reconnectInterval);
            };

            this.socket.onerror = (error: Event) => {
                console.error('GlobalWebsocket error:', error);
            };
        }
    }

    addEventHandler(key: string, handler: () => void) {
        if (key) {
            this.eventHandlers.set(key, handler);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export default new GlobalWebsocketService();
import {Notification} from "@arco-design/web-vue";

export interface IWebSocketService {
    connect(project: string): void;

    disconnect(): void;
}

class GlobalWebsocketService implements IWebSocketService {
    private socket: WebSocket | null;
    private reconnectInterval: number;

    constructor() {
        this.socket = null;
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
                if (data.type === 'error') {
                    Notification.error({
                        title: `系统异常`,
                        content: data.message,
                        position: 'topRight',
                    })
                }
                if (data.type === 'success') {
                    Notification.success({
                        title: data.title,
                        content: data.message,
                        position: 'topRight',
                    })
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

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export default new GlobalWebsocketService();
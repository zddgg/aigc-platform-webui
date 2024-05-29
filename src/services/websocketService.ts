export interface IWebSocketService {
    connect(project: string): void;
    addMessageHandler(key: string, handler: (data: any) => void): void;
    removeMessageHandler(key: string): void;
    sendMessage(message: any): void;
    disconnect(): void;
}

class WebSocketService implements IWebSocketService {
    private socket: WebSocket | null;
    private messageHandlers: Map<string, (data: any) => void>;
    private reconnectInterval: number;

    constructor() {
        this.socket = null;
        this.messageHandlers = new Map();
        this.reconnectInterval = 5000; // 5秒重连间隔
    }

    connect(project: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.socket = new WebSocket(`ws://localhost:8080/ws?project=${project}`);

            this.socket.onopen = () => {
                console.log('WebSocket connection opened.');
            };

            this.socket.onmessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                const handler = this.messageHandlers.get(`${data.project}-${data.chapter}`);
                if (handler) {
                    handler(data.chapterInfo);
                } else {
                    console.warn(`No handler found for ${data.project}-${data.chapter}`);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket connection closed.');
                // 断线重连
                setTimeout(() => {
                    console.log('Reconnecting WebSocket...');
                    this.connect(project);
                }, this.reconnectInterval);
            };

            this.socket.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
            };
        }
    }

    addMessageHandler(key: string, handler: (data: any) => void) {
        if (key) {
            this.messageHandlers.set(key, handler);
        }
    }

    removeMessageHandler(key: string) {
        this.messageHandlers.delete(key);
    }

    sendMessage(message: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. ReadyState:', this.socket?.readyState);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.messageHandlers.clear();
    }
}

export default new WebSocketService();
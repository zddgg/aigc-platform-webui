export interface IWebSocketService {
    connect(project: string): void;

    addResultHandler(key: string, handler: (data: any) => void): void;

    addResultHandler(key: string, handler: (data: any) => void): void;

    disconnect(): void;
}

class WebSocketService implements IWebSocketService {
    private socket: WebSocket | null;
    private resultHandlers: Map<string, (data: any) => void>;
    private stageHandler: (data: any) => void;
    private reconnectInterval: number;

    constructor() {
        this.socket = null;
        this.resultHandlers = new Map();
        this.stageHandler = () => {
        };
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
                if (data.type === 'result') {
                    const handler = this.resultHandlers.get(`${data.project}-${data.chapter}`);
                    if (handler) {
                        handler(data.chapterInfo);
                    }
                }
                if (data.type === 'stage') {
                    this.stageHandler(data)
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

    addResultHandler(key: string, handler: (data: any) => void) {
        if (key) {
            this.resultHandlers.set(key, handler);
        }
    }

    addStageHandler(handler: (data: any) => void) {
        this.stageHandler = handler
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.resultHandlers.clear();
    }
}

export default new WebSocketService();
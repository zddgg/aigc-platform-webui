/// <reference types="vite/client" />
import mitt from 'mitt';

export type EventBus = ReturnType<typeof mitt>;
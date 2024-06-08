import {ChatTtsConfig} from "@/api/chat-tts.ts";

export interface Model {
    id: number;
    name: string;
    group: string;
    gptWeights: string;
    sovitsWeights: string;
}

export interface ModelConfig {
    modelType: string;
    model?: string[]
    audio?: string[];
    chatTtsConfig?: ChatTtsConfig;
}
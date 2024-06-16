import {GptSovitsConfig, GptSovitsModel} from "@/api/gpt-sovits.ts";
import {FishSpeechConfig, FishSpeechModel} from "@/api/fish-speech.ts";
import {ChatTtsConfig} from "@/api/chat-tts.ts";
import {EdgeTtsConfig} from "@/api/edge-tts.ts";
import {RefAudioEntity} from "@/api/ref-audio.ts";

export interface Model {
    id: number;
    name: string;
    group: string;
    gptWeights: string;
    sovitsWeights: string;
}

export interface AudioModelConfig {
    audioModelType: string;
    audioModelId: string;
    audioConfigId: string;
    refAudioId: string;

    gptSovitsModel?: GptSovitsModel;
    gptSovitsConfig?: GptSovitsConfig;

    fishSpeechModel?: FishSpeechModel;
    fishSpeechConfig?: FishSpeechConfig;

    chatTtsConfig?: ChatTtsConfig;

    edgeTtsConfig?: EdgeTtsConfig;

    refAudio?: RefAudioEntity;
}
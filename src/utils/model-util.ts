import {ModelSelect} from "@/api/ref-audio.ts";

export const voiceNameFormat = (shortName: string) => {
    if (!shortName) {
        return undefined
    }
    return shortName.substring(shortName.lastIndexOf('-') + 1).replace('Neural', '')
}

export const modelNameFormat = (modelSelect: ModelSelect | undefined) => {
    return modelSelect?.model?.join('/')
}

export const audioNameFormat = (modelSelect: ModelSelect | undefined) => {
    if (modelSelect?.modelType === 'edge-tts') {
        return undefined;
    }
    return modelSelect?.audio?.filter((_, index) => index < 3).join('/')
}

export const refAudioNameFormat = (modelSelect: ModelSelect | undefined) => {
    if (modelSelect?.modelType === 'edge-tts') {
        return undefined;
    }
    return modelSelect?.audio?.filter((_, index) => index === 3).join('/')
}
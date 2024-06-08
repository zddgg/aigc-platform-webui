export interface ChatTtsConfig {
    configName: string;
    saveAudio: boolean;
    temperature: number;
    top_P: number;
    top_K: number;
    audio_seed_input: number;
    text_seed_input: number;
    refine_text_flag: boolean;
    params_refine_text: string;
    text: string;
    outputText: string;
    url: string;
}
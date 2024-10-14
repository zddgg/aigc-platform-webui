<script setup lang="ts">
import {ref} from "vue";
import TextModelServer from "@/views/model/text-model-server/index.vue";
import AudioModelServer from "@/views/model/audio-model-server/index.vue";
import RefAudio from "@/views/model/prompt-audio/index.vue";
import GptSovits from "@/views/model/gpt-sovits/index.vue";
import FishSpeech from "@/views/model/fish-speech/index.vue";
import EdgeTts from "@/views/model/edge-tts/index.vue";
import ChatTts from "@/views/model/chat-tts/index.vue";
import CosyVoice from "@/views/model/cosy-voice/index.vue";

const modelTypes = [
  '文本大模型', '音频生成服务', '参考音频', 'gpt-sovits', 'fish-speech', 'edge-tts', 'chat-tts', 'cosy-voice'
]
const activeModelType = ref('文本大模型')

const changeModelType = (item: string) => {
  activeModelType.value = item
}
</script>

<template>
  <div style="display: flex; padding: 20px 10px 20px 20px">
    <div style="width: 10%; height: calc(100vh - 42px)">
      <n-scrollbar style="max-height: calc(100vh - 42px)">
        <div style="padding-right: 10px">
          <a-space style="width: 100%" direction="vertical">
            <a-card
                v-for="(item, index) in modelTypes"
                :key="index"
                style="border: 1px #cccccc solid; border-radius: 8px"
                :style="activeModelType === item && { backgroundColor: '#C3F6F6' }"
                @click="changeModelType(item)"
            >
              <div style="padding: 10px 0">
                {{ item }}
              </div>
            </a-card>
          </a-space>
        </div>
      </n-scrollbar>
    </div>
    <a-divider direction="vertical" style="margin: 0 20px 0 10px" />
    <div style="width: 90%">
      <a-scrollbar style="max-height: calc(100vh - 42px); overflow: auto">
        <div style="padding-right: 10px">
          <div v-if="activeModelType === '文本大模型'">
            <text-model-server/>
          </div>
          <div v-if="activeModelType === '音频生成服务'">
            <audio-model-server/>
          </div>
          <div v-if="activeModelType === '参考音频'">
            <ref-audio/>
          </div>
          <div v-if="activeModelType === 'gpt-sovits'">
            <gpt-sovits/>
          </div>
          <div v-if="activeModelType === 'fish-speech'">
            <fish-speech/>
          </div>
          <div v-if="activeModelType === 'edge-tts'">
            <edge-tts/>
          </div>
          <div v-if="activeModelType === 'chat-tts'">
            <chat-tts/>
          </div>
          <div v-if="activeModelType === 'cosy-voice'">
            <cosy-voice/>
          </div>
        </div>
      </a-scrollbar>
    </div>
  </div>
</template>

<style scoped>

</style>
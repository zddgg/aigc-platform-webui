<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import EtVoiceView from "@/views/audio-select/components/et-voice-view.vue";
import ChatTtsView from "@/views/audio-select/components/chat-tts-view.vue";
import {AudioModelConfig} from "@/api/model.ts";
import GptSovitsView from "@/views/audio-select/components/gpt-sovits-view.vue";
import FishSpeechView from "@/views/audio-select/components/fish-speech-view.vue";
import {GPT_SOVITS} from "@/types/model-types.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  audioModelConfig: {
    type: Object as PropType<AudioModelConfig>
  }
})

const emits = defineEmits(['update:visible', 'modelSelect']);

const showModal = ref(false);
const activeTabKey = ref<string>('');

const close = () => {
  emits('update:visible', false);
  activeTabKey.value = ''
}

const modelSelect = (modelConfig: AudioModelConfig) => {
  emits('modelSelect', modelConfig);
  close();
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        activeTabKey.value = props.audioModelConfig?.audioModelType ?? GPT_SOVITS;
      }
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="选择音频"
        :hide-title="true"
        :footer="false"
        :width="960"
        :esc-to-close="false"
        @close="close"
        @cancel="close"
    >
      <div style="cursor: pointer">
        <a-tabs v-model:active-key="activeTabKey">
          <template #extra>
            <a-button
                size="small"
                shape="round"
                @click="close"
            >
              <template #icon>
                <icon-close/>
              </template>
            </a-button>
          </template>
          <a-tab-pane key="gpt-sovits" title="gpt-sovits">
            <gpt-sovits-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="fish-speech" title="fish-speech">
            <fish-speech-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="chat-tts" title="chat-tts">
            <chat-tts-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="edge-tts" title="edge-tts">
            <et-voice-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
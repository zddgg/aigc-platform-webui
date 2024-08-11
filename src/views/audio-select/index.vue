<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {AudioModelInfoKey} from "@/api/model.ts";
import PromptAudioView from "@/views/audio-select/components/prompt-audio-view.vue";
import EdgeTtsView from "@/views/audio-select/components/edge-tts-view.vue";
import ChatTtsView from "@/views/audio-select/components/chat-tts-view.vue";
import CosyVoiceView from "@/views/audio-select/components/cosy-voice-view.vue";
import {FISH_SPEECH, GPT_SOVITS} from "@/types/model-types.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  audioModelInfo: {
    type: Object as PropType<AudioModelInfoKey>
  }
})

const emits = defineEmits(['update:visible', 'modelSelect']);

const showModal = ref(false);
const activeTabKey = ref<string>('');

const close = () => {
  emits('update:visible', false);
  activeTabKey.value = ''
}

const modelSelect = (audioModelInfo: AudioModelInfoKey) => {
  emits('modelSelect', audioModelInfo);
  close();
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        activeTabKey.value = props.audioModelInfo?.amType ?? GPT_SOVITS;
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
        draggable
        @close="close"
        @cancel="close"
    >
      <div style="cursor: pointer">
        <a-tabs v-model:active-key="activeTabKey" :lazy-load="true">
          <template #extra>
            <a-button
                size="mini"
                shape="round"
                @click="close"
            >
              <template #icon>
                <icon-close/>
              </template>
            </a-button>
          </template>
          <a-tab-pane key="gpt-sovits" title="gpt-sovits">
            <prompt-audio-view
                v-model:visible="props.visible"
                :model-type="GPT_SOVITS"
                :active-tab-key="activeTabKey"
                :audio-model-info="props.audioModelInfo"
                :select-size="2"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="fish-speech" title="fish-speech">
            <prompt-audio-view
                v-model:visible="props.visible"
                :model-type="FISH_SPEECH"
                :active-tab-key="activeTabKey"
                :audio-model-info="props.audioModelInfo"
                :select-size="1"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="chat-tts" title="chat-tts">
            <chat-tts-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-info="props.audioModelInfo"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="edge-tts" title="edge-tts">
            <edge-tts-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-info="props.audioModelInfo"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="cosy-voice" title="cosy-voice">
            <cosy-voice-view
                v-model:visible="props.visible"
                :model-type="GPT_SOVITS"
                :active-tab-key="activeTabKey"
                :audio-model-info="props.audioModelInfo"
                :select-size="2"
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
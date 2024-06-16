<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import RefAudioView from "@/views/audio-select/components/ref-audio-view.vue";
import EtVoiceView from "@/views/audio-select/components/et-voice-view.vue";
import ChatTtsView from "@/views/audio-select/components/chat-tts-view.vue";
import {AudioModelConfig} from "@/api/model.ts";

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
        activeTabKey.value = props.audioModelConfig?.audioModelType === 'gpt-sovits'
        || props.audioModelConfig?.audioModelType === 'fish-speech'
            ? '1'
            : props.audioModelConfig?.audioModelType === 'chat-tts'
                ? '2'
                : props.audioModelConfig?.audioModelType === 'edge-tts'
                    ? '3'
                    : '1';
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
          <a-tab-pane key="1" title="gpt-sovits/fish-speech">
            <ref-audio-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="2" title="chat-tts">
            <chat-tts-view
                v-model:visible="props.visible"
                :active-tab-key="activeTabKey"
                :audio-model-config="props.audioModelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="3" title="edge-tts">
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
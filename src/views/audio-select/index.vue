<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import RefAudioView from "@/views/audio-select/components/ref-audio-view.vue";
import EtVoiceView from "@/views/audio-select/components/et-voice-view.vue";
import ChatTtsView from "@/views/audio-select/components/chat-tts-view.vue";
import {ModelConfig} from "@/api/model.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelConfig: {
    type: Object as PropType<ModelConfig>
  }
})

const emits = defineEmits(['update:visible', 'modelSelect']);

const showModal = ref(false);
const activeTabKey = ref<string>('');

const close = () => {
  emits('update:visible', false);
  activeTabKey.value = ''
}

const modelSelect = (modelConfig: ModelConfig) => {
  emits('modelSelect', modelConfig);
  close();
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        activeTabKey.value = props.modelConfig?.modelType === 'gpt-sovits'
        || props.modelConfig?.modelType === 'fish-speech'
            ? '1'
            : props.modelConfig?.modelType === 'edge-tts'
                ? '2'
                : props.modelConfig?.modelType === 'chat-tts'
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
                :active-tab-key="activeTabKey"
                :model-config="props.modelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="2" title="edge-tts">
            <et-voice-view
                :active-tab-key="activeTabKey"
                :model-config="props.modelConfig"
                @model-select="modelSelect"
            />
          </a-tab-pane>
          <a-tab-pane key="3" title="chat-tts">
            <chat-tts-view
                :active-tab-key="activeTabKey"
                :model-config="props.modelConfig"
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
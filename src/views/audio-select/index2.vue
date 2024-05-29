<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {ModelSelect} from "@/api/ref-audio.ts";
import RefAudioView from "@/views/audio-select/components/ref-audio-view.vue";
import EtVoiceView from "@/views/audio-select/components/et-voice-view.vue";
import SelectView from "@/views/audio-select/components/select-view.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  modelSelect: {
    type: Object as PropType<ModelSelect>
  }
})

const emits = defineEmits(['update:visible', 'change']);

const showModal = ref(false);

const close = () => {
  emits('update:visible', false);
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-modal v-model:visible="showModal"
             title="选择音频"
             :hide-title="true"
             :footer="false"
             :width="960"
             @close="close"
             @cancel="close"
    >
      <div style="display: flex; height: 600px; cursor: pointer">
        <div style="width: 60%">
          <a-tabs default-active-key="1">
            <a-tab-pane key="1" title="GPT-SoVITS\fish-speech">
              <ref-audio-view/>
            </a-tab-pane>
            <a-tab-pane key="2" title="Edge-TTS">
              <et-voice-view/>
            </a-tab-pane>
          </a-tabs>
        </div>
        <a-divider direction="vertical"/>
        <div style="width: 40%">
          <div
              style="height: 39px; display: flex;
              justify-content: right;
              align-items: center;
              border-bottom: 1px #cccccc solid"
          >
            <icon-close
                :size="24"
                @click="close"
            />
          </div>
          <div style="padding-right: 20px; margin-top: 16px">
            <select-view/>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
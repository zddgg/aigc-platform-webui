<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {chapterExpose} from "@/api/text-chapter.ts";
import {AudioTaskEvent} from "@/types/global.ts";
import emitter from "@/mitt";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  chapterInfoIds: {
    type: Array as PropType<number[]>,
    default: []
  }
});
const emits = defineEmits(['update:visible']);

const showModal = ref(false)
const combineAudio = ref(true);
const subtitle = ref(true);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  if (!combineAudio.value && !subtitle.value) {
    done(true);
  }
  const {msg} = await chapterExpose({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
    chapterInfoIds: props.chapterInfoIds,
    combineAudio: combineAudio.value,
    subtitle: subtitle.value,
  })
  Message.success(msg);
  emitter?.emit(AudioTaskEvent.audio_combine);
  done(true);
}

const close = () => {
  emits('update:visible', false);
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
    },
    {immediate: true}
)
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="合并导出"
        :unmount-on-close="true"
        :width="760"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-space size="large">
        <a-checkbox v-model="combineAudio">合并音频</a-checkbox>
        <a-checkbox v-model="subtitle">生成字幕</a-checkbox>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped>
</style>
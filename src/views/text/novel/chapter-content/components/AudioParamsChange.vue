<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {updateControls} from "@/api/text-chapter.ts";

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
const emits = defineEmits(['update:visible', 'change']);

const showModal = ref(false)

const form = ref<{
  enableVolume: boolean,
  volume: number,
  enableSpeed: boolean,
  speed: number,
  enableInterval: boolean,
  interval: number,
}>({
  enableVolume: false,
  volume: 1,
  enableSpeed: false,
  speed: 1,
  enableInterval: false,
  interval: 300,
})

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  if (!form.value.enableVolume
      && !form.value.enableSpeed
      && !form.value.enableInterval) {
    Message.warning("没有选择需要更新的内容！")
  } else {
    const {msg} = await updateControls({
      projectId: route.query.projectId as string,
      chapterId: route.query.chapterId as string,
      chapterInfoIds: props.chapterInfoIds,
      ...form.value
    });
    form.value = {
      ...form.value,
      enableVolume: false,
      enableSpeed: false,
      enableInterval: false,
    }
    Message.success(msg);
    emits('change')
  }
  done(true);
}

const close = () => {
  emits('update:visible', false);
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        form.value = {
          enableVolume: false,
          volume: 1,
          enableSpeed: false,
          speed: 1,
          enableInterval: false,
          interval: 300,
        }
      }
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
      <a-space direction="vertical" size="large" style="width: 100%">
        <a-card style="width: 100%">
          <a-space size="large">
            <a-checkbox v-model="form.enableVolume">音量</a-checkbox>
            <n-slider
                v-model:value="form.volume"
                style="width: 200px"
                :step="0.1"
                :max="2"
                :min="0"
                :format-tooltip="(value: number) => `${value}x`"
            >
            </n-slider>
          </a-space>
        </a-card>
        <a-card>
          <a-space size="large">
            <a-checkbox v-model="form.enableSpeed">语速</a-checkbox>
            <n-slider
                v-model:value="form.speed"
                style="width: 200px"
                :step="0.1"
                :max="2"
                :min="0.1"
                :format-tooltip="(value: number) => `${value}x`"
            >
            </n-slider>
          </a-space>
        </a-card>
        <a-card>
          <a-space size="large">
            <a-checkbox v-model="form.enableInterval">间隔</a-checkbox>
            <n-slider
                v-model:value="form.interval"
                style="width: 200px"
                :step="100"
                :max="3000"
                :min="0"
                :format-tooltip="(value: number) => `${value}ms`"
            >
            </n-slider>
          </a-space>
        </a-card>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped>
</style>
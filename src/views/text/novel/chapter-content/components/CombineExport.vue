<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {Message} from "@arco-design/web-vue";
import {chapterExpose} from "@/api/text-chapter.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  selectedIndexes: {
    type: Array as PropType<string[]>,
    default: []
  }
});
const emits = defineEmits(['update:visible']);

const showModal = ref(false)
const combineAudio = ref(true);
const subtitle = ref(false);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  if (!combineAudio.value && !subtitle.value) {
    done(true);
  }
  const {msg} = await chapterExpose({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
    indexes: props.selectedIndexes,
    combineAudio: combineAudio.value,
    subtitle: subtitle.value,
  })
  Message.success(msg);
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
      <!--      <n-scrollbar style="height: 300px">-->
      <!--        <div style="padding-right: 10px">-->
      <!--          <a-table-->
      <!--              row-key="index"-->
      <!--              :data="chapterInfos"-->
      <!--              :columns="columns"-->
      <!--              :bordered="{cell:true}"-->
      <!--              :pagination="false"-->
      <!--              size="small"-->
      <!--          >-->
      <!--            <template #text="{ record }">-->
      <!--              <a-typography-text>-->
      <!--                {{ record.text }}-->
      <!--              </a-typography-text>-->
      <!--            </template>-->
      <!--            <template #interval="{ record }">-->
      <!--              <a-input-number-->
      <!--                  v-model="record.interval"-->
      <!--                  mode="button"-->
      <!--                  size="mini"-->
      <!--                  :step="100"-->
      <!--                  :min="0"-->
      <!--                  style="width: 120px"-->
      <!--              />-->
      <!--            </template>-->
      <!--            <template #interval-filter>-->
      <!--              <div class="custom-filter">-->
      <!--                <a-space direction="vertical">-->
      <!--                  <a-input-number-->
      <!--                      v-model="allInterval"-->
      <!--                      mode="button"-->
      <!--                      size="mini"-->
      <!--                      :step="100"-->
      <!--                      :min="0"-->
      <!--                      style="width: 120px"-->
      <!--                  />-->
      <!--                  <div class="custom-filter-footer">-->
      <!--                    <a-button-->
      <!--                        type="outline" size="mini"-->
      <!--                              @click="updateAllInterval"-->
      <!--                    >更新全部-->
      <!--                    </a-button>-->
      <!--                  </div>-->
      <!--                </a-space>-->
      <!--              </div>-->
      <!--            </template>-->
      <!--          </a-table>-->
      <!--        </div>-->
      <!--      </n-scrollbar>-->
      <a-space size="large">
        <a-checkbox v-model="combineAudio">合并音频</a-checkbox>
        <a-checkbox v-model="subtitle">生成字幕</a-checkbox>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped>
.custom-filter {
  padding: 10px;
  background: var(--color-bg-5);
  border: 1px solid var(--color-neutral-3);
  border-radius: var(--border-radius-medium);
  box-shadow: 0 2px 5px rgb(0 0 0 / 10%);
}

.custom-filter-footer {
  display: flex;
  justify-content: right;
}
</style>
<script setup lang="ts">

import {ref, watch} from "vue";
import {PromptAudioSort, queryPromptAudioSorts, updatePromptAudioSorts} from "@/api/prompt-audio.ts";
import {Message, TableColumnData} from "@arco-design/web-vue";
import {VueDraggable} from "vue-draggable-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const columns: TableColumnData[] = [
  {title: '顺序', slotName: 'sortOrder'},
  {title: '群组', dataIndex: 'group'},
  {title: '是否展示', slotName: 'showFlag'},
]

const emits = defineEmits(['update:visible', 'change']);
const showModal = ref(false);
const promptAudioSorts = ref<PromptAudioSort[]>([])
const dataChange = ref<boolean>(false);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  if (dataChange.value) {
    promptAudioSorts.value = promptAudioSorts.value.map((item, index) => {
      return {
        ...item,
        sortOrder: index
      }
    })
    const {msg} = await updatePromptAudioSorts(promptAudioSorts.value);
    Message.success(msg);
    emits('change')
  }
  done(true);
};

const handleQueryPromptAudioSort = async () => {
  const {data} = await queryPromptAudioSorts()
  promptAudioSorts.value = data;
}

const close = () => {
  emits('update:visible', false);
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        handleQueryPromptAudioSort()
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="参考音频分组排序"
        :width="960"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <vue-draggable v-model="promptAudioSorts" target="tbody" :animation="150" :on-update="() => dataChange = true">
        <a-table
            :data="promptAudioSorts"
            :columns="columns"
            :bordered="{cell:true}"
            :pagination="false"
            :scroll="{y: 460}"
        >
          <template #sortOrder="{ rowIndex }">
            {{ rowIndex + 1 }}
          </template>
          <template #showFlag="{ record }">
            <a-switch
                v-model="record.showFlag"
                checked-text="是"
                unchecked-text="否"
                type="round"
                @change="() => dataChange = true"
            />
          </template>
        </a-table>
      </vue-draggable>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
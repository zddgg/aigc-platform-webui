<script setup lang="ts">

import {ref, watch} from "vue";
import {queryRefAudioSort, RefAudioSort, updateRefAudioSort} from "@/api/ref-audio.ts";
import {Message} from "@arco-design/web-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['update:visible', 'change']);
const showModal = ref(false);
const refAudioSorts = ref<RefAudioSort[]>([])

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  refAudioSorts.value = refAudioSorts.value.map((item, index) => {
    return {
      ...item,
      sortOrder: index
    }
  })
  const {msg} = await updateRefAudioSort(refAudioSorts.value);
  Message.success(msg);
  done(true);
  emits('change')
};

const handleQueryRefAudioSort = async () => {
  const {data} = await queryRefAudioSort()
  refAudioSorts.value = data;
  console.log(data)
}

const sortChange = (_data) => {
  refAudioSorts.value = _data
}

const close = () => {
  emits('update:visible', false);
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        handleQueryRefAudioSort()
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
        :width="700"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-table
          :data="refAudioSorts"
          :columns="[{title: '顺序', slotName: 'sortOrder'}, {title: 'group', dataIndex: 'group'}, {title: '是否展示', slotName: 'showFlag'}]"
          :pagination="false"
          :draggable="{ type: 'handle', width: 40 }"
          @change="sortChange"
      >
        <template #sortOrder="{ rowIndex }">
          {{ rowIndex + 1 }}
        </template>
        <template #showFlag="{ record }">
          <a-switch
              v-model="record.showFlag"
          />
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
<script setup lang="ts">

import {ref, watch} from "vue";
import {TableColumnData} from "@arco-design/web-vue";
import {getByModelType as queryModelConfigs, updateEdgeTtsShowFlag} from "@/api/am-model-config.ts";
import {EDGE_TTS} from "@/types/model-types.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const columns: TableColumnData[] = [
  {title: '语言', slotName: 'lang'},
  {title: '是否展示', slotName: 'showFlag'},
]

const emits = defineEmits(['update:visible', 'change']);
const showModal = ref(false);
const dataChange = ref<{ [key: string]: boolean }>({});

const modelConfigs = ref<{ lang: string, showFlag: boolean }[]>([])

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  if (dataChange.value) {
    await updateEdgeTtsShowFlag(dataChange.value)
    emits('change')
  }
  done(true);
};


const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: EDGE_TTS, showMode: -1})

  modelConfigs.value = Object.values(
      data.map((item) => {
        return {
          lang: JSON.parse(item.mcParamsJson).locale.substring(0, JSON.parse(item.mcParamsJson).locale.indexOf('-')),
          showFlag: item.showFlag,
        }
      }).reduce((acc: any, item) => {
        const {lang, showFlag} = item;

        // 初始化或更新逻辑或（OR）结果
        if (!acc[lang]) {
          acc[lang] = {lang, showFlag};
        } else {
          acc[lang].showFlag = acc[lang].showFlag || showFlag;
        }

        return acc;
      }, {})
  );
}

const close = () => {
  emits('update:visible', false);
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        handleQueryModelConfigs()
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="批量设置"
        :width="960"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-table
          :data="modelConfigs"
          :columns="columns"
          :bordered="{cell:true}"
          :pagination="false"
          :scroll="{y: 460}"
      >
        <template #lang="{ record }">
          {{ record.lang }}
        </template>
        <template #showFlag="{ record }">
          <a-switch
              v-model="record.showFlag"
              checked-text="是"
              unchecked-text="否"
              type="round"
              @change="(value: any) => {dataChange[record.lang] = value as boolean}"
          />
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
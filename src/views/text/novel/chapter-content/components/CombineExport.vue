<script setup lang="ts">
import {h, PropType, ref, watch} from "vue";
import {ChapterInfo, queryChapterInfo} from "@/api/text.ts";
import {useRoute} from "vue-router";
import {TableColumnData} from "@arco-design/web-vue";
import {IconSearch} from '@arco-design/web-vue/es/icon';

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
const chapterInfos = ref<ChapterInfo[]>([])

const columns: TableColumnData[] = [
  {
    title: 'index',
    dataIndex: 'index',
  },
  {
    title: '台词',
    slotName: 'text'
  },
  {
    title: '合并间隔(毫秒)',
    slotName: 'interval',
    filterable: {
      filter: (value, record) => record.name.includes(value),
      slotName: 'interval-filter',
      icon: () => h(IconSearch)
    }
  },
];
const handleBeforeOk = async (done: (closed: boolean) => void) => {
  // const res = await formRef.value?.validate();
  // if (!res) {
  //   done(false);
  // } else {
  //   done(false);
  // }
  done(true);
}

const handleQueryChapterInfo = async () => {
  const {data} = await queryChapterInfo({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
    indexes: props.selectedIndexes,
  })
  chapterInfos.value = data;
}

const close = () => {
  emits('update:visible', false);
}

const allInterval = ref(0)
const updateAllInterval = () => {
  chapterInfos.value = chapterInfos.value.map((item: ChapterInfo) => {
    return {
      ...item,
      interval: allInterval.value
    }
  });
  allInterval.value = 0;
}

watch(() => props.visible,
    () => {
      if (props.visible) {
        console.log(props.selectedIndexes)
        handleQueryChapterInfo();
      }
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
      <n-scrollbar style="height: 300px">
        <div style="padding-right: 10px">
          <a-table
              row-key="index"
              :data="chapterInfos"
              :columns="columns"
              :bordered="{cell:true}"
              :pagination="false"
              size="small"
          >
            <template #text="{ record }">
              <a-typography-text>
                {{ record.text }}
              </a-typography-text>
            </template>
            <template #interval="{ record }">
              <a-input-number
                  v-model="record.interval"
                  mode="button"
                  size="mini"
                  :step="100"
                  :min="0"
                  style="width: 120px"
              />
            </template>
            <template #interval-filter>
              <div class="custom-filter">
                <a-space direction="vertical">
                  <a-input-number
                      v-model="allInterval"
                      mode="button"
                      size="mini"
                      :step="100"
                      :min="0"
                      style="width: 120px"
                  />
                  <div class="custom-filter-footer">
                    <a-button
                        type="outline" size="mini"
                              @click="updateAllInterval"
                    >更新全部
                    </a-button>
                  </div>
                </a-space>
              </div>
            </template>
          </a-table>
        </div>
      </n-scrollbar>
      <div style="margin-top: 10px; display: flex; justify-content: right">
        <a-checkbox>生成字幕文件</a-checkbox>
      </div>
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
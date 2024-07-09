<script setup lang="ts">

import {inject, ref, watch} from "vue";
import {linesPatternOptions} from "@/data/data.ts";
import {chapterSplit, tmpChapterSplit} from "@/api/text-project.ts";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message, Modal} from "@arco-design/web-vue";
import {chapters4Sort as queryTextChapterList, chapterSort, TextChapter} from "@/api/text-chapter.ts";
import {EventBus} from "@/vite-env";
import {VueDraggable} from "vue-draggable-plus";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
});

const emits = defineEmits(['update:visible', 'refresh'])
const {loading, setLoading} = useLoading();

const eventBus = inject<EventBus>('eventBus');

const chapterPatternOptions = [
  {
    label: '第*[章节卷集部篇回]*',
    value: '^\\s*第.{1,9}[章节卷集部篇回].*',
  },
  {
    label: '占一行的纯数字章节名',
    value: '^\\d+$',
  },
];


const showModal = ref<boolean>(false);
const chapterTitles = ref<{ text: string }[]>([]);
const formRef = ref<FormInstance>()
const form = ref({
  chapterPattern: '',
  dialoguePattern: '',
  validate: false
});

const handleTmpChapterSplit = async () => {
  try {
    setLoading(true);
    const {data} = await tmpChapterSplit({
      projectId: route.query.projectId as string,
      chapterPattern: form.value.chapterPattern,
      dialoguePattern: form.value.dialoguePattern,
    });
    chapterTitles.value = data.map((item) => {
      return {text: item};
    });
    form.value.validate = true;
  } finally {
    setLoading(false);
  }
}

const handleChapterSplit = async () => {
  const res = await formRef.value?.validate();
  if (!res) {
    if (!form.value.validate) {
      Modal.error({
        title: '完成章节切分规则验证，确认章节切分正确',
        content: '',
      })
    } else {
      const {msg} = await chapterSplit({
        projectId: route.query.projectId as string,
        chapterPattern: form.value.chapterPattern,
        dialoguePattern: form.value.dialoguePattern,
      });
      Message.success(msg);
      close();
      emits('refresh')
    }
  } else {
  }
}

const textChapters = ref<TextChapter[]>([]);
const sortChanged = ref<boolean>(false);

const queryChapters = async () => {
  const {data} = await queryTextChapterList({
    projectId: route.query.projectId as string,
  })
  textChapters.value = data.map((item, index) => {
    return {
      ...item,
      sortOrder: index
    }
  })
}

const handleChapterSort = async () => {
  if (sortChanged.value) {
    const sortChapters = textChapters.value
        .map((item, index) => {
          return {
            id: item.id,
            sortOrder: index,
          } as TextChapter
        });
    const {msg} = await chapterSort(sortChapters)
    Message.success(msg);
    close();
    eventBus?.emit(ROLE_CHANGE)
  }
}

const close = () => {
  emits('update:visible', false);
}

const activeTab = ref('1')

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        queryChapters()
        activeTab.value= '1'
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="章节设置"
        :width="1080"
        :footer="false"
        @close="close"
        @cancel="close"
    >
      <a-tabs v-model:active-key="activeTab" :position="'left'">
        <a-tab-pane key="1" title="章节解析">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form
                  ref="formRef"
                  :model="form"
                  size="small"
                  :label-col-props="{ span: 6 }"
                  :wrapper-col-props="{ span: 18 }"
              >
                <a-form-item label="章节切分" field="chapterPattern" required>
                  <a-select
                      v-model="form.chapterPattern"
                      allow-create
                      allow-clear
                      :options="chapterPatternOptions"
                  >
                  </a-select>
                  <a-button
                      type="primary"
                      style="margin-left: 10px"
                      @click="handleTmpChapterSplit"
                  >
                    验证
                  </a-button>
                </a-form-item>
                <a-form-item label="对话解析" field="dialoguePattern">
                  <a-select
                      v-model="form.dialoguePattern"
                      allow-create
                      allow-clear
                      :options="linesPatternOptions"
                  >
                  </a-select>
                </a-form-item>
              </a-form>
            </a-col>
            <a-col :span="12">
              <n-scrollbar style="height: 500px; padding-right: 10px">
                <a-table
                    v-if="chapterTitles.length > 0"
                    :data="chapterTitles"
                    :columns="[{ title: '章节名', dataIndex: 'text' }]"
                    :pagination="false"
                    :loading="loading"
                    style="width: 100%"
                />
              </n-scrollbar>
            </a-col>
          </a-row>
          <a-divider/>
          <div style="text-align: right">
            <a-button @click="close">取消</a-button>
            <a-button
                type="primary" style="margin-left: 10px"
                @click="handleChapterSplit"
            >
              确认
            </a-button>
          </div>
        </a-tab-pane>
        <a-tab-pane key="2" title="章节排序" :destroy-on-hide="true">
          <n-scrollbar style="height: 500px; padding-right: 10px">
            <div v-if="textChapters && textChapters.length > 0">
              <vue-draggable v-model="textChapters" target="tbody" :on-change="() => (sortChanged = true)">
                <a-table
                    row-key="chapterId"
                    :data="textChapters"
                    :columns="[
              { title: '顺序', slotName: 'sortOrder', width: 80 },
              { title: '章节名称', slotName: 'chapterName' }
              ]"
                    :bordered="{cell:true}"
                    :pagination="false"
                    :row-class="'cursor-move'"
                >
                  <template #sortOrder="{ rowIndex }">
                    {{ rowIndex }}
                  </template>
                  <template #chapterName="{ record }">
                    {{ record.chapterName }}
                  </template>
                </a-table>
              </vue-draggable>
            </div>
          </n-scrollbar>
          <a-divider/>
          <div style="text-align: right">
            <a-button @click="close">取消</a-button>
            <a-button
                type="primary" style="margin-left: 10px"
                @click="handleChapterSort"
            >
              确认
            </a-button>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
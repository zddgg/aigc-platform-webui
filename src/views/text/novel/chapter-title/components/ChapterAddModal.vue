<script setup lang="ts">
import {inject, ref, watch} from "vue";
import {linesPatternOptions} from "@/data/data.ts";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {
  chapterAdd,
  ChapterInfo,
  chapters4Sort as queryTextChapterList,
  TextChapter,
  tmpDialogueParse,
} from "@/api/text-chapter.ts";
import {VueDraggable} from 'vue-draggable-plus'
import {EventBus} from "@/vite-env";
import {ROLE_CHANGE} from "@/types/event-types.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['update:visible'])
const eventBus = inject<EventBus>('eventBus');

const dialogueParseLoading = useLoading();
const chapterSortLoading = useLoading();

const showDialogue = ref<boolean>(true);
const showAside = ref<boolean>(true);
const showDialogueTable = ref<boolean>(false);
const showSortTable = ref<boolean>(false);

const cacheTextChapters = ref<TextChapter[]>([]);
const textChapters = ref<TextChapter[]>([]);

const sortChanged = ref(false)

const showModal = ref<boolean>(false);
const chapterInfos = ref<ChapterInfo[]>([]);
const formRef = ref<FormInstance>()
const form = ref<TextChapter & { validate: boolean }>({
  dialoguePattern: '',
  validate: false
} as any);

const tmpChapterId = '123456789987654321';

const handleTmpDialogueParse = async () => {
  showDialogueTable.value = true;
  showSortTable.value = false;

  const res = await formRef.value?.validate();
  if (!res) {
    try {
      dialogueParseLoading.setLoading(true);
      const {data} = await tmpDialogueParse(form.value);
      chapterInfos.value = data;
      form.value.validate = true;
    } finally {
      dialogueParseLoading.setLoading(false);
    }
  }
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const sortChapters: TextChapter[] = []
    if (sortChanged.value) {
      textChapters.value.forEach((item, index) => {
        if (item.chapterId === tmpChapterId) {
          form.value.sortOrder = index
        } else {
          sortChapters.push({
            id: item.id,
            sortOrder: index,
          } as TextChapter)
        }
      });
    }

    const {msg} = await chapterAdd({
      textChapter: {
        ...form.value,
        projectId: route.query.projectId as string,
        sortOrder: form.value.sortOrder ?? 0
      },
      sortChapters: sortChapters
    });
    Message.success(msg);
    done(true);
    eventBus?.emit(ROLE_CHANGE)
  } else {
    done(false);
  }
}

const handleChapterSort = () => {
  try {
    chapterSortLoading.setLoading(true);
    showDialogueTable.value = false;
    showSortTable.value = true;

    textChapters.value = [
      {chapterId: tmpChapterId, chapterName: form.value.chapterName} as TextChapter,
      ...cacheTextChapters.value
    ]

  } finally {
    chapterSortLoading.setLoading(false);
  }
}

const queryChapters = async () => {
  const {data} = await queryTextChapterList({
    projectId: route.query.projectId as string,
  })
  cacheTextChapters.value = data;
  textChapters.value = data;
}

const handleChapterNameChange = (value: string) => {
  textChapters.value = textChapters.value.map((item) => {
    if (item.chapterId === tmpChapterId) {
      return {
        ...item,
        chapterName: value
      }
    }
    return item
  })
}

const sortInputChange = (target: number | undefined, current: number) => {
  if (target) {
    textChapters.value.splice(current, 1);
    textChapters.value.splice(target, 0,
        {chapterId: tmpChapterId, chapterName: form.value.chapterName} as TextChapter);
  }
}

const close = () => {
  emits('update:visible', false);
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        queryChapters()

        chapterInfos.value = []
        formRef.value?.resetFields();
        form.value = {} as any;
        showDialogue.value = true
        showAside.value = true
        showDialogueTable.value = false
        showSortTable.value = false
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="新增章节"
        :width="1080"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div style="height: 600px; padding: 0 20px">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form
                ref="formRef"
                :model="form"
                size="small"
                :label-col-props="{ span: 5 }"
                :wrapper-col-props="{ span: 19 }"
            >
              <a-form-item label="章节标题" field="chapterName" required>
                <a-input v-model="form.chapterName" @change="handleChapterNameChange"/>
                <a-button
                    type="primary"
                    style="margin-left: 10px"
                    :disabled="!form.chapterName"
                    :loading="chapterSortLoading.loading.value"
                    @click="handleChapterSort"
                >
                  排序
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
                <a-button
                    type="primary"
                    style="margin-left: 10px"
                    :loading="dialogueParseLoading.loading.value"
                    @click="handleTmpDialogueParse"
                >
                  解析
                </a-button>
              </a-form-item>
              <a-form-item label="章节内容" field="content" required>
                <n-scrollbar style="max-height: 500px">
                  <a-textarea
                      v-model="form.content"
                      placeholder="章节内容"
                      :auto-size="{ minRows: 3 }"/>
                </n-scrollbar>
              </a-form-item>
            </a-form>
          </a-col>
          <a-col :span="12">
            <div>
              <div v-if="showDialogueTable">
                <div style="margin-bottom: 15px">
                  <a-checkbox
                      v-model="showDialogue"
                      @change="(value) => {
                        if (!value) {
                          showAside = true
                        }
                      }"
                  >
                    对话
                  </a-checkbox>
                  <a-checkbox
                      v-model="showAside"
                      @change="(value) => {
                        if (!value) {
                          showDialogue = true
                        }
                      }"
                  >
                    非对话
                  </a-checkbox>
                </div>
                <n-scrollbar style="height: 560px; padding-right: 10px">
                  <a-table
                      :data="chapterInfos
                    .filter((item) => (item.dialogueFlag && showDialogue) || (!item.dialogueFlag && showAside))
                  "
                      :loading="dialogueParseLoading.loading.value"
                      :columns="[{ title: '文本', dataIndex: 'text' }, {title: '对话', slotName: 'dialogueFlag' }]"
                      :bordered="{cell:true}"
                      :pagination="false"
                  >
                    <template #dialogueFlag="{ record }">
                      <a-tag v-if="record.dialogueFlag" color="green" size="small">
                        <icon-check-circle-fill/>
                      </a-tag>
                      <a-tag v-else size="small">
                        <icon-close-circle/>
                      </a-tag>
                    </template>
                  </a-table>
                </n-scrollbar>
              </div>
              <div v-if="showSortTable">
                <n-scrollbar style="height: 600px; padding-right: 10px">
                  <vue-draggable v-model="textChapters" target="tbody" :on-change="() => (sortChanged = true)">
                    <a-table
                        :data="textChapters"
                        :loading="chapterSortLoading.loading.value"
                        :columns="[
                          { title: '序号', slotName: 'sortOrder', width: 80 },
                          { title: '章节名称', slotName: 'chapterName' }
                        ]"
                        :bordered="{cell:true}"
                        :pagination="false"
                        :row-class="'cursor-move'"
                    >
                      <template #sortOrder="{ rowIndex }">
                        {{ rowIndex }}
                      </template>
                      <template #chapterName="{ record, rowIndex }">
                        <div style="width: 100%; display: flex; justify-content: space-between">
                          <div>
                            <span>
                            {{ record.chapterName }}
                            </span>
                            <a-tag
                                v-if="record.chapterId === tmpChapterId"
                                color="green"
                                size="small"
                                style="margin-left: 10px"
                            >
                              <icon-check-circle-fill/>
                            </a-tag>
                          </div>
                          <div v-if="record.chapterId === tmpChapterId">
                            <span>快速移动：</span>
                            <a-input-number
                                placeholder="序号"
                                size="mini"
                                style="width: 80px"
                                @change="(value) => sortInputChange(value, rowIndex)"
                            />
                          </div>
                        </div>
                      </template>
                    </a-table>
                  </vue-draggable>
                </n-scrollbar>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
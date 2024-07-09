<script setup lang="ts">
import {inject, ref, watch} from "vue";
import {linesPatternOptions} from "@/data/data.ts";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {chapterEdit, ChapterInfo, getTextChapter, TextChapter, tmpDialogueParse,} from "@/api/text-chapter.ts";
import {EventBus} from "@/vite-env";
import {ROLE_CHANGE} from "@/services/eventTypes.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  chapterId: {
    type: String
  }
});

const emits = defineEmits(['update:visible'])
const eventBus = inject<EventBus>('eventBus');

const dialogueParseLoading = useLoading();

const showDialogue = ref<boolean>(true);
const showAside = ref<boolean>(true);
const showDialogueTable = ref<boolean>(false);

const showModal = ref<boolean>(false);
const chapterInfos = ref<ChapterInfo[]>([]);
const formRef = ref<FormInstance>()
const form = ref<TextChapter & { validate: boolean }>({
  dialoguePattern: '',
  validate: false
} as any);

const handleTmpDialogueParse = async () => {
  showDialogueTable.value = true;

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

const handleQueryChapterText = async () => {
  const {data} = await getTextChapter({
    projectId: route.query.projectId as string,
    chapterId: props.chapterId as string,
  })
  form.value = data as any;
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await chapterEdit(form.value);
    Message.success(msg);
    done(true);
    eventBus?.emit(ROLE_CHANGE)
  } else {
    done(false);
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
        handleQueryChapterText()

        chapterInfos.value = []
        formRef.value?.resetFields();
        showDialogue.value = true
        showAside.value = true
        showDialogueTable.value = false
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="章节编辑"
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
                <a-input v-model="form.chapterName"/>
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
              <a-form-item label="对话解析" field="content" required>
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
                    :columns="[
                        { title: 'index', slotName: 'index' },
                        { title: '文本', dataIndex: 'text' },
                        {title: '对话', slotName: 'dialogueFlag' }
                        ]"
                    :bordered="{cell:true}"
                    :pagination="false"
                >
                  <template #index="{ rowIndex }">
                    {{ rowIndex + 1 }}
                  </template>
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
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
<script setup lang="ts">
import {ref, watch} from "vue";
import {linesPatternOptions} from "./data.ts";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message} from "@arco-design/web-vue";
import {ChapterInfo, dialogueParse, getContent, tmpDialogueParse} from "@/api/text-chapter.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  chapterTitle: {
    type: String,
  }
});

const emits = defineEmits(['update:visible', 'refresh'])
const {loading, setLoading} = useLoading();

const textContent = ref<string>('')
const showModal = ref<boolean>(false);
const chapterInfos = ref<ChapterInfo[]>([]);
const formRef = ref<FormInstance>()
const form = ref({
  chapterPattern: '',
  linesPattern: '',
  validate: false
});

const handleTmpLinesParse = async () => {
  const res = await formRef.value?.validate();
  if (!res) {
    try {
      setLoading(true);
      const {data} = await tmpDialogueParse({
        projectId: route.query.projectId as string,
        chapterId: props.chapterTitle as string,
        dialoguePattern: form.value.linesPattern,
        textContent: textContent.value,
      });
      chapterInfos.value = data;
      form.value.validate = true;
    } finally {
      setLoading(false);
    }
  }
}

const handleQueryChapterText = async () => {
  const {data} = await getContent({
    projectId: route.query.projectId as string,
    chapterId: props.chapterTitle as string,
  })
  textContent.value = data;
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await dialogueParse({
      projectId: route.query.projectId as string,
      chapterId: props.chapterTitle as string,
      dialoguePattern: form.value.linesPattern,
      textContent: textContent.value,
    });
    Message.success(msg);
    done(true);
    emits('refresh')
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
      }
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="章节解析"
        :width="960"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div style="max-height: 600px">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form
                ref="formRef"
                :model="form"
                size="small"
                :label-col-props="{ span: 6 }"
                :wrapper-col-props="{ span: 18 }"
            >
              <a-form-item label="台词解析规则" field="linesPattern">
                <a-select
                    v-model="form.linesPattern"
                    allow-create
                    allow-clear
                    :options="linesPatternOptions"
                >
                </a-select>
                <a-button
                    type="primary"
                    style="margin-left: 10px"
                    @click="handleTmpLinesParse"
                >
                  验证
                </a-button>
              </a-form-item>
              <div style="margin-left: 20px">
                <n-scrollbar style="max-height: 500px; padding-right: 10px">
                  <a-textarea
                      v-model="textContent"
                      :auto-size="{ minRows: 3 }"/>
                </n-scrollbar>
              </div>
            </a-form>
          </a-col>
          <a-col :span="12">
            <n-scrollbar style="height: 550px; padding-right: 10px">
              <a-table
                  :data="chapterInfos"
                  :loading="loading"
                  :columns="[{ title: '文本', dataIndex: 'text' }]"
                  :pagination="false"
                  style="width: 100%"
              />
            </n-scrollbar>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
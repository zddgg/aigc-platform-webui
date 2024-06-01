<script setup lang="ts">

import {ref, watch} from "vue";
import {linesPatternOptions} from "./data.ts";
import {chapterSplit, tmpChapterSplit} from "@/api/text.ts";
import {useRoute} from "vue-router";
import useLoading from "@/hooks/loading.ts";
import {FormInstance, Message, Modal} from "@arco-design/web-vue";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  }
});

const emits = defineEmits(['update:visible', 'refresh'])
const {loading, setLoading} = useLoading();

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
  linesPattern: '',
  validate: false
});

const handleTmpChapterSplit = async () => {
  try {
    setLoading(true);
    const {data} = await tmpChapterSplit({
      project: route.query.project as string,
      chapterPattern: form.value.chapterPattern,
      linesPattern: form.value.linesPattern,
    });
    chapterTitles.value = data.map((item) => {
      return {text: item};
    });
    form.value.validate = true;
  } finally {
    setLoading(false);
  }
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    if (!form.value.validate) {
      Modal.error({
        title: '完成章节切分规则验证，确认章节切分正确',
        content: '',
      })
      done(false);
    } else {
      const {msg} = await chapterSplit({
        project: route.query.project as string,
        chapterPattern: form.value.chapterPattern,
        linesPattern: form.value.linesPattern,
      });
      Message.success(msg);
      emits('refresh')
      done(true);
    }
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
      <a-row :gutter="24">
        <a-col :span="16">
          <a-form
              ref="formRef"
              :model="form"
              size="small"
              :label-col-props="{ span: 6 }"
              :wrapper-col-props="{ span: 18 }"
          >
            <a-form-item label="章节切分规则" field="chapterPattern" required>
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
            <a-form-item label="台词解析规则" field="linesPattern">
              <a-select
                  v-model="form.linesPattern"
                  allow-create
                  allow-clear
                  :options="linesPatternOptions"
              >
              </a-select>
            </a-form-item>
          </a-form>
        </a-col>
        <a-col :span="8">
          <n-scrollbar style="height: 300px">
            <a-table
                v-if="chapterTitles.length > 0"
                :data="chapterTitles"
                :columns="[{ title: '章节名', dataIndex: 'text' }]"
                :pagination="false"
                style="width: 100%"
            />
          </n-scrollbar>
        </a-col>
      </a-row>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
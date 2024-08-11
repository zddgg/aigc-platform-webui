<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="创建新项目"
        :width="960"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div class="container">
        <a-form
            ref="formRef"
            :model="form"
            :label-col-props="{span: 4}"
            :wrapper-col-props="{span: 20}"
        >
          <a-form-item
              field="project"
              label="项目名称"
              required
          >
            <a-input
                v-model="form.project"
                placeholder="please enter your project..."
            />
          </a-form-item>
          <a-form-item
              field="format"
              label="格式"
          >
            <a-select
                v-model="form.format"
                :options="formatSymbolOptions"
            >
            </a-select>
          </a-form-item>
        </a-form>
        <a-row>
          <a-col :span="12">
            <n-layout
                :native-scrollbar="false"
                style="height: 500px"
            >
              <n-input v-model:value="form.text" type="textarea" placeholder="每行当作一句" style="height: 450px"/>
              <div style="margin-top: 10px">
                <a-button @click="parseText">解析</a-button>
              </div>
            </n-layout>
          </a-col>
          <a-col :span="12">
            <n-layout
                :native-scrollbar="false"
                style="height: 500px; margin-left: 10px"
            >
              <a-table
                  :data="chapterInfos"
                  :columns="[{title: '角色', dataIndex: 'role', width: 80}, {title: '文本', dataIndex: 'text'}]"
                  :bordered="{cell:true}"
                  :pagination="false"
                  size="small"
              >

              </a-table>
            </n-layout>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue';
import {createFormatTextProject} from '@/api/text-project.ts';
import {ChapterInfo} from "@/api/text-chapter.ts";
import {FormInstance} from "@arco-design/web-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  projectType: {
    type: String,
  }
});

const emits = defineEmits(['update:visible', 'close']);

const showModal = ref(false);
const formRef = ref<FormInstance>()

const form = ref({
  project: '',
  format: 'aside',
  text: '',
});

const formatSymbolOptions = [
  {
    label: '全是旁白',
    value: 'aside',
    symbol: ''
  },
  {
    label: '角色：文本(全角：)',
    value: 'fullWidth',
    symbol: '：'
  },
  {
    label: '角色:文本(半角:)',
    value: 'halfWidth',
    symbol: ':'
  },
  {
    label: '角色 文本(一个空格)',
    value: 'space',
    symbol: ' '
  }
]

const chapterInfos = ref<ChapterInfo[]>([]);

const parseText = () => {

  const find = formatSymbolOptions.find((item) => item.value === form.value.format)

  chapterInfos.value = form.value.text.split('\n')
      .filter((item) => !!item)
      .map((item) => {
        if (find?.symbol) {
          return {
            role: item.substring(0, item.indexOf(find?.symbol)).trim() || '旁白',
            text: item.substring(item.indexOf(find?.symbol) + 1).trim(),
          } as ChapterInfo
        } else {
          return {
            role: '旁白',
            text: item.trim(),
          } as ChapterInfo
        }
      })
};

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    if (chapterInfos.value && chapterInfos.value.length) {
      await createFormatTextProject({
        projectName: form.value.project,
        projectType: props.projectType as string,
        chapterInfos: chapterInfos.value,
      });
      done(true)
    }
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
  emits('close');
}

watch(
    () => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        form.value.project = '';
      }
    },
    {immediate: true}
);
</script>

<style scoped>
.container:deep(.arco-upload-list-item .arco-upload-progress) {
  display: none;
}
</style>

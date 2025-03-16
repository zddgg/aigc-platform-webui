<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="创建新项目"
        :width="600"
        ok-text="创建项目"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div class="container">
        <a-form ref="formRef" :model="form">
          <a-form-item field="project" label="项目名称" required>
            <a-input
                v-model="form.project"
                placeholder="please enter your project..."
            />
          </a-form-item>
          <a-form-item label="小说文本">
            <a-upload
                :auto-upload="false"
                :limit="1"
                draggable
                @change="onChange"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue';
import {FileItem} from '@arco-design/web-vue/es/upload/interfaces';
import {createProject} from '@/api/text-project.ts';
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
});

const file = ref<FileItem | null>(null);

const onChange = (_: FileItem[], fileItem: FileItem) => {
  file.value = {
    ...fileItem,
  };
  if (!form.value.project) {
    form.value.project = file.value?.name?.replace(/\.[^.]+$/, '') || '';
  }
};

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const formData = new FormData();
    formData.append('project', form.value.project);
    formData.append('projectType', props.projectType as string);
    formData.append('file', file.value?.file as Blob);
    await createProject(formData);
    done(true)
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
        file.value = null;
      }
    },
    {immediate: true}
);
</script>

<style scoped>
.container {
  padding: 20px;
}

.container:deep(.arco-upload-list-item .arco-upload-progress) {
  display: none;
}
</style>

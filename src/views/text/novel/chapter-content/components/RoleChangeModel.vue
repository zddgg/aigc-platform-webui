<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {ChapterInfo, queryCommonRoles, queryRoles, Role, textRoleChange} from "@/api/text.ts";
import {useRoute} from "vue-router";
import {FormInstance, Message} from "@arco-design/web-vue";
import {audioNameFormat, modelNameFormat, refAudioNameFormat} from "@/utils/model-util.ts";

const route = useRoute();
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  chapterInfo: {
    type: Object as PropType<ChapterInfo>
  }
})

const emits = defineEmits(['update:visible', 'change']);

const formRef = ref<FormInstance>()
const form = ref({
  role: '',
  loadModel: false,
})

const showModal = ref<boolean>(false);

const roles = ref<Role[]>([])
const commonRoles = ref<Role[]>([])

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  roles.value = data;
}
const handleQueryCommonRoles = async () => {
  const {data} = await queryCommonRoles({
    project: route.query.project as string
  })
  commonRoles.value = data;
}

const computedRoles = computed(() => {
  let arr: ({ type: string } & Role)[] = [];
  commonRoles.value.forEach((role: Role) => {
    arr.push({
      ...role,
      type: '预置角色',
    });
  });
  roles.value.filter(item => item.role !== props.chapterInfo?.role)
      .forEach((role: Role) => {
        arr.push({
          ...role,
          type: '',
        });
      });
  return arr;
})

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const find = commonRoles.value.find(item => `预置角色-${item.role}` === form.value.role)
    const find1 = roles.value.find(item => item.role === form.value.role)
    if (!find && !find1 && form.value.role.startsWith('预置角色')) {
      formRef.value?.setFields({
        role: {
          status: 'error',
          message: `角色名不能以[预置角色]开头`
        },
      });
      done(false);
    } else {

      const {msg} = await textRoleChange({
        chapter: {
          project: route.query.project as string,
          chapter: route.query.chapter as string,
        },
        chapterInfo: {
          ...props.chapterInfo,
          ...currentRole.value,
          role: currentRole.value.role.replace('预置角色-', ''),
        } as ChapterInfo,
        loadModel: form.value.loadModel,
      });

      Message.success(msg);
      done(true);
      emits('change')
    }
  } else {
    done(false);
  }
}

const close = () => {
  emits('update:visible', false);
}

const currentRole = ref<Role>({} as Role)

const onRoleChange = (value: any) => {
  const roleName = value as string
  currentRole.value = {role: roleName} as Role;

  const find = commonRoles.value.find(item => `预置角色-${item.role}` === roleName)
  const find1 = roles.value.find(item => item.role === roleName)

  if (form.value.loadModel && (find || find1)) {
    currentRole.value = {
      ...(find ?? find1),
      ...currentRole.value,
    }
  } else {
    currentRole.value = {
      ...props.chapterInfo,
      ...currentRole.value,
    }
  }
}

const onLoadModelChange = (value: any) => {
  if (!form.value.role) {
    return;
  }

  const loadModel = value as boolean
  currentRole.value = {role: form.value.role} as Role;

  const find = commonRoles.value.find(item => `预置角色-${item.role}` === form.value.role)
  const find1 = roles.value.find(item => item.role === form.value.role)

  if (loadModel && (find || find1)) {
    currentRole.value = {
      ...(find ?? find1),
      ...currentRole.value,
    }
  } else {
    currentRole.value = {
      ...props.chapterInfo,
      ...currentRole.value,
    }
  }
}

watch(
    () => props.visible,
    async () => {
      if (props.visible) {
        await handleQueryRoles();
        await handleQueryCommonRoles();
        form.value = {} as any;
        formRef.value?.resetFields();
        currentRole.value = {} as any;
      }
      showModal.value = props.visible
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        :title="props.chapterInfo?.role ?? '未命名'"
        :unmount-on-close="true"
        :width="760"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <div style="padding: 0 20px">
        <a-form
            ref="formRef"
            :model="form"
            size="small"
        >
          <a-form-item
              label="角色"
              field="role"
              help="可以手动输入创建新角色"
              required
          >
            <a-select
                v-model="form.role"
                allow-create
                @change="onRoleChange"
            >
              <a-option
                  v-for="(item, index) in computedRoles"
                  :key="index"
                  :value="`${item.type ? item.type + '-' : ''}${item.role}`"
                  :label="`${item.type ? item.type + '-' : ''}${item.role}`"
              >
                <span>{{ item.role }}</span>
                <a-tag
                    v-if="item.type === '预置角色'"
                    size="small"
                    color="green"
                    style="margin-left: 20px"
                >
                  <span>预置角色</span>
                </a-tag>
              </a-option>
            </a-select>
          </a-form-item>
          <a-form-item
              label="模型"
              field="loadModel"
          >
            <a-checkbox
                v-model="form.loadModel"
                @change="onLoadModelChange"
            >使用选择角色的模型
            </a-checkbox>
          </a-form-item>
        </a-form>
        <a-divider/>
        <div>
          <a-row :gutter="24">
            <a-col :span="12">
              <div v-if="['gpt-sovits', 'fish-speech'].includes(props.chapterInfo?.modelType as string)">
                <a-descriptions title="当前角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ props.chapterInfo?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ props.chapterInfo?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ modelNameFormat(props.chapterInfo) }}
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="props.chapterInfo?.modelType !== 'edge-tts'"
                      label="audio"
                  >
                    {{ audioNameFormat(props.chapterInfo) }}
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="props.chapterInfo?.modelType !== 'edge-tts'"
                      label="refAudio"
                  >
                    {{ refAudioNameFormat(props.chapterInfo) }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
              <div v-if="['edge-tts'].includes(props.chapterInfo?.modelType as string)">
                <a-descriptions title="当前角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ props.chapterInfo?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ props.chapterInfo?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ modelNameFormat(props.chapterInfo) }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
              <div v-if="['chat-tts'].includes(props.chapterInfo?.modelType as string)">
                <a-descriptions title="当前角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ props.chapterInfo?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ props.chapterInfo?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ props.chapterInfo?.chatTtsConfig?.configName }}
                  </a-descriptions-item>
                  <a-descriptions-item label="audio_seed">
                    {{ props.chapterInfo?.chatTtsConfig?.audio_seed_input }}
                  </a-descriptions-item>
                  <a-descriptions-item label="text_seed">
                    {{ props.chapterInfo?.chatTtsConfig?.text_seed_input }}
                  </a-descriptions-item>
                  <a-descriptions-item label="top_P">
                    {{ props.chapterInfo?.chatTtsConfig?.top_P }}
                  </a-descriptions-item>
                  <a-descriptions-item label="top_K">
                    {{ props.chapterInfo?.chatTtsConfig?.top_K }}
                  </a-descriptions-item>
                  <a-descriptions-item label="temperature">
                    {{ props.chapterInfo?.chatTtsConfig?.temperature }}
                  </a-descriptions-item>
                  <a-descriptions-item label="refine_flag">
                    {{ props.chapterInfo?.chatTtsConfig?.refine_text_flag }}
                  </a-descriptions-item>
                  <a-descriptions-item label="refine_params">
                    {{ props.chapterInfo?.chatTtsConfig?.params_refine_text }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </a-col>
            <a-col :span="12">
              <div v-if="['gpt-sovits', 'fish-speech'].includes(currentRole?.modelType)">
                <a-descriptions title="变更后角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ currentRole?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ currentRole?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ modelNameFormat(currentRole) }}
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="currentRole?.modelType !== 'edge-tts'"
                      label="audio"
                  >
                    {{ audioNameFormat(currentRole) }}
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="currentRole?.modelType !== 'edge-tts'"
                      label="refAudio"
                  >
                    {{ refAudioNameFormat(currentRole) }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
              <div v-if="['edge-tts'].includes(currentRole?.modelType)">
                <a-descriptions title="变更后角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ currentRole?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ currentRole?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ modelNameFormat(currentRole) }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
              <div v-if="['chat-tts'].includes(currentRole?.modelType)">
                <a-descriptions title="变更后角色" bordered size="medium" :column="1">
                  <a-descriptions-item label="角色名">
                    {{ currentRole?.role }}
                  </a-descriptions-item>
                  <a-descriptions-item label="modelType">
                    {{ currentRole?.modelType }}
                  </a-descriptions-item>
                  <a-descriptions-item label="model">
                    {{ currentRole.chatTtsConfig?.configName }}
                  </a-descriptions-item>
                  <a-descriptions-item label="audio_seed">
                    {{ currentRole.chatTtsConfig?.audio_seed_input }}
                  </a-descriptions-item>
                  <a-descriptions-item label="text_seed">
                    {{ currentRole.chatTtsConfig?.text_seed_input }}
                  </a-descriptions-item>
                  <a-descriptions-item label="top_P">
                    {{ currentRole.chatTtsConfig?.top_P }}
                  </a-descriptions-item>
                  <a-descriptions-item label="top_K">
                    {{ currentRole.chatTtsConfig?.top_K }}
                  </a-descriptions-item>
                  <a-descriptions-item label="temperature">
                    {{ currentRole.chatTtsConfig?.temperature }}
                  </a-descriptions-item>
                  <a-descriptions-item label="refine_flag">
                    {{ currentRole.chatTtsConfig?.refine_text_flag }}
                  </a-descriptions-item>
                  <a-descriptions-item label="refine_params">
                    {{ currentRole.chatTtsConfig?.params_refine_text }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
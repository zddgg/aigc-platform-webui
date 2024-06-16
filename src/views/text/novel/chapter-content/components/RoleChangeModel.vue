<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {FormInstance, Message} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {
  ChapterInfo,
  commonRoles as queryCommonRoles,
  roles as queryRoles,
  TextRole,
  textRoleChange
} from "@/api/text-chapter.ts";

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
  loadModel: true,
})

const showModal = ref<boolean>(false);

const roles = ref<TextRole[]>([])
const commonRoles = ref<TextRole[]>([])

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  roles.value = data;
}
const handleQueryCommonRoles = async () => {
  const {data} = await queryCommonRoles({
    projectId: route.query.projectId as string
  })
  commonRoles.value = data;
}

const computedRoles = computed(() => {
  let arr: ({ type: string } & TextRole)[] = [];
  commonRoles.value.forEach((role: TextRole) => {
    arr.push({
      ...role,
      type: '预置角色',
    });
  });
  roles.value.filter(item => item.role !== props.chapterInfo?.role)
      .forEach((role: TextRole) => {
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
        projectId: route.query.projectId as string,
        chapterId: route.query.chapterId as string,
        chapterInfoId: props.chapterInfo?.id as string,
        formRoleName: currentRole.value.role.replace('预置角色-', ''),
        fromRoleType: currentRole.value.role.startsWith('预置角色') ? 'commonRole' : 'role',
        changeModel: form.value.loadModel,
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

const currentRole = ref<TextRole>({} as TextRole)

const onRoleChange = (value: any) => {

  console.log(value)

  let find;
  if (value.startsWith('预置角色')) {
    find = commonRoles.value.find(item => `预置角色-${item.role}` === value)
    console.log(find)

  } else {
    find = roles.value.find(item => item.role === value)
    console.log(find)
    console.log(11)
  }


  if (form.value.loadModel && find) {
    currentRole.value = {
      ...find,
      ...currentRole.value,
      role: value,
    }
  } else {
    currentRole.value = {
      ...props.chapterInfo,
      ...currentRole.value,
      role: value,
    }
  }
}

const onLoadModelChange = (value: any) => {
  if (!form.value.role) {
    return;
  }

  const loadModel = value as boolean
  currentRole.value = {role: form.value.role} as TextRole;

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
            >
              使用选择角色的模型
            </a-checkbox>
          </a-form-item>
        </a-form>
        <a-divider/>
        <div>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-descriptions
                  title="当前角色"
                  :column="1"
                  size="medium"
                  bordered
              >
                <a-descriptions-item label="类型">
                  {{ props.chapterInfo?.audioModelType }}
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(props.chapterInfo?.audioModelType as string)"
                    label="模型"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${props.chapterInfo?.gptSovitsModel?.modelGroup}/${props.chapterInfo?.gptSovitsModel?.modelName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(props.chapterInfo?.audioModelType as string)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ props.chapterInfo?.gptSovitsConfig?.configName }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(props.chapterInfo?.audioModelType as string)"
                    label="音频"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${props.chapterInfo?.refAudio?.audioGroup}/${props.chapterInfo?.refAudio?.audioName}/${props.chapterInfo?.refAudio?.moodName}/${props.chapterInfo?.refAudio?.moodAudioName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['fish-speech'].includes(props.chapterInfo?.audioModelType as string)"
                    label="模型"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${props.chapterInfo?.fishSpeechModel?.modelGroup}/${props.chapterInfo?.fishSpeechModel?.modelName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['fish-speech'].includes(props.chapterInfo?.audioModelType as string)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ `${props.chapterInfo?.fishSpeechConfig?.configName}` }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['fish-speech'].includes(props.chapterInfo?.audioModelType as string)"
                    label="音频"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${props.chapterInfo?.refAudio?.audioGroup}/${props.chapterInfo?.refAudio?.audioName}/${props.chapterInfo?.refAudio?.moodName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['chat-tts'].includes(props.chapterInfo?.audioModelType as string)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ props.chapterInfo?.chatTtsConfig?.configName }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['edge-tts'].includes(props.chapterInfo?.audioModelType as string)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ voiceNameFormat(props.chapterInfo?.audioConfigId as string) }}
                  </a-typography-text>
                </a-descriptions-item>
              </a-descriptions>
            </a-col>
            <a-col :span="12">
              <div v-if="currentRole?.audioModelType">
                <a-descriptions
                    title="变更后角色"
                    :column="1"
                    size="medium"
                    bordered
                >
                  <a-descriptions-item label="类型">
                    {{ currentRole?.audioModelType }}
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="['gpt-sovits'].includes(currentRole?.audioModelType)"
                      label="模型"
                  >
                    <a-typography-text ellipsis>
                      {{ `${currentRole?.gptSovitsModel?.modelGroup}/${currentRole?.gptSovitsModel?.modelName}` }}
                    </a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="['gpt-sovits'].includes(currentRole?.audioModelType)"
                      label="配置"
                  >
                    <a-typography-text ellipsis>
                      {{ currentRole.gptSovitsConfig?.configName }}
                    </a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="['gpt-sovits'].includes(currentRole?.audioModelType)"
                      label="音频"
                  >
                    <a-typography-text ellipsis>
                      {{
                        `${currentRole?.refAudio?.audioGroup}/${currentRole?.refAudio?.audioName}/${currentRole?.refAudio?.moodName}/${currentRole?.refAudio?.moodAudioName}`
                      }}
                    </a-typography-text>
                  </a-descriptions-item>

                  <a-descriptions-item
                      v-if="['fish-speech'].includes(currentRole?.audioModelType)"
                      label="模型"
                  >
                    <a-typography-text ellipsis>
                      {{ `${currentRole?.fishSpeechModel?.modelGroup}/${currentRole?.fishSpeechModel?.modelName}` }}
                    </a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="['fish-speech'].includes(currentRole?.audioModelType)"
                      label="配置"
                  >
                    <a-typography-text ellipsis>
                      {{ `${currentRole?.fishSpeechConfig?.configName}` }}
                    </a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item
                      v-if="['fish-speech'].includes(currentRole?.audioModelType)"
                      label="音频"
                  >
                    <a-typography-text ellipsis>
                      {{
                        `${currentRole?.refAudio?.audioGroup}/${currentRole?.refAudio?.audioName}/${currentRole?.refAudio?.moodName}`
                      }}
                    </a-typography-text>
                  </a-descriptions-item>

                  <a-descriptions-item
                      v-if="['chat-tts'].includes(currentRole?.audioModelType)"
                      label="配置"
                  >
                    <a-typography-text ellipsis>
                      {{ currentRole?.chatTtsConfig?.configName }}
                    </a-typography-text>
                  </a-descriptions-item>

                  <a-descriptions-item
                      v-if="['edge-tts'].includes(currentRole?.audioModelType)"
                      label="配置"
                  >
                    <a-typography-text ellipsis>
                      {{ voiceNameFormat(currentRole?.audioConfigId) }}
                    </a-typography-text>
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
:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>
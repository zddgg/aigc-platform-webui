<script setup lang="ts">
import {useRoute} from "vue-router";
import {computed, ref, watch} from "vue";
import {
  commonRoleModelChange,
  createCommonRole,
  deleteCommonRole,
  queryCommonRoles,
  queryRoles,
  Role,
} from "@/api/text.ts";
import {FormInstance, Message, Modal} from "@arco-design/web-vue";
import AudioSelect from '@/views/audio-select/index.vue'
import RoleRename from "@/views/text/novel/chapter-role/components/RoleRename.vue";
import {ModelConfig} from "@/api/model.ts";

const route = useRoute();

const emits = defineEmits(['roleModelChange'])

const modelSelectVisible = ref<boolean>(false);

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

const ruleActiveKey = ref<(string | number)[]>([])
const openAllRule = () => {
  ruleActiveKey.value.length !== 0
      ? ruleActiveKey.value = []
      : ruleActiveKey.value = [...Array(commonRoles.value.length).keys()]
}

const currentRole = ref<Role>({} as Role);
const selectModelType = ref<'roleModelChange' | 'addCommonRole' | ''>('')
const roleSelectModel = (role: Role) => {
  selectModelType.value = 'roleModelChange'
  currentRole.value = role;
  modelSelectVisible.value = true
}

const addCommonRole = () => {
  selectModelType.value = 'addCommonRole'
  modelSelectVisible.value = true
}

const refresh = () => {
  handleQueryRoles();
  handleQueryCommonRoles();
  emits('roleModelChange');
}

const handleRoleModelChange = async (modelConfig: ModelConfig) => {
  currentRole.value = {
    ...currentRole.value,
    ...modelConfig,
  }

  roles.value = roles.value.map(item => {
    if (item.role === currentRole.value.role) {
      return {
        ...item,
        ...modelConfig,
      }
    }
    return item;
  })

  const {msg} = await commonRoleModelChange({
    chapter: {
      project: route.query.project as string
    },
    role: {
      ...currentRole.value,
      ...modelConfig,
    }
  })

  Message.success(msg);
  refresh()
}

const addCommonRoleFormRef = ref<FormInstance>()
const addCommonRoleVisible = ref<boolean>(false)
const handleAddCommonRole = (modelConfig: ModelConfig) => {
  currentRole.value = {
    ...modelConfig
  } as Role;
  addCommonRoleVisible.value = true;
}

const modelSelect = (modelConfig: ModelConfig) => {
  if (selectModelType.value === 'roleModelChange') {
    handleRoleModelChange(modelConfig);
  }
  if (selectModelType.value === 'addCommonRole') {
    handleAddCommonRole(modelConfig);
  }
}

const computedAddFormModel = computed(() => {
  return currentRole.value.model?.join('/')
})

const computedAddFormAudio = computed(() => {
  return currentRole.value.audio?.filter((_, index) => index < 3).join('/')
})

const computedAddFormRefAudio = computed(() => {
  return currentRole.value.audio?.filter((_, index) => index === 3).join('/')
})

const handleAddCommonRoleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await addCommonRoleFormRef.value?.validate();
  if (!res) {
    const find = commonRoles.value.find(item => item.role === currentRole.value.role)
    if (find) {
      addCommonRoleFormRef.value?.setFields({
        role: {
          status: 'error',
          message: `已存在[${find.role}]预置角色`
        },
      })
      done(false);
    } else {

      const {msg} = await createCommonRole({
        chapter: {
          project: route.query.project as string,
        },
        role: currentRole.value,
      })
      Message.success(msg);
      refresh();
      handleAddCommonRoleClose();
      done(true);
    }
  } else {
    done(false);
  }
}

const handleAddCommonRoleClose = () => {
  currentRole.value = {} as Role;
  addCommonRoleFormRef.value?.clearValidate()
}

const roleRenameModalVisible = ref<boolean>(false)
const onRoleRename = (role: Role) => {
  currentRole.value = role;
  roleRenameModalVisible.value = true;
}

const onDeleteRole = (role: Role) => {
  Modal.error({
    title: `确认删除公共角色[${role.role}]?`,
    content: '',
    async onOk() {
      const {msg} = await deleteCommonRole({
        chapter: {
          project: route.query.project as string,
        },
        role: role
      });
      Message.success(msg);
      refresh();
    },
  })
}


watch(
    () => route.query.chapter,
    () => {
      handleQueryRoles();
      handleQueryCommonRoles();
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <div v-if="!commonRoles || !commonRoles.length">
      <a-empty/>
    </div>
    <div v-else>
      <a-button
          v-if="commonRoles && commonRoles.length"
          type="outline"
          size="small"
          style="margin-bottom: 12px"
          @click="openAllRule"
      >
        {{ ruleActiveKey.length !== 0 ? '收起所有' : '展开所有' }}
      </a-button>
      <a-collapse
          :active-key="ruleActiveKey"
          @change="(value) => (ruleActiveKey = value)"
      >
        <a-collapse-item v-for="(item, index) in commonRoles" :key="index">
          <template #header>
            <span>{{ item.role }}</span>
            <span style="margin-left: 10px; color: #707070">性别: </span>
            <span style="margin-left: 10px">
                    {{ item.gender ?? '未知' }}
                  </span>
            <span style="margin-left: 10px; color: #707070">年龄段: </span>
            <span style="margin-left: 10px">
                    {{ item.ageGroup ?? '未知' }}
                  </span>
          </template>
          <div>
            <div v-if="['gpt-sovits', 'fish-speech'].includes(item.modelType)">
              <a-descriptions
                  :column="1"
                  size="medium"
              >
                <a-descriptions-item label="类型">
                  {{ item.modelType }}
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="item.model && item.model.length"
                    label="模型"
                >
                  {{ item.model.join('/') }}
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="item.audio && item.audio.length"
                    label="音频"
                >
                  <a-typography-text ellipsis>
                    {{ item.audio.join('/') }}
                  </a-typography-text>
                </a-descriptions-item>
              </a-descriptions>
            </div>
            <div v-if="['edge-tts'].includes(item.modelType)">
              <a-descriptions
                  :column="1"
                  size="medium"
              >
                <a-descriptions-item label="类型">
                  {{ item.modelType }}
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="item.model && item.model.length"
                    label="声音"
                >
                  {{ item.model.join('/') }}
                </a-descriptions-item>
              </a-descriptions>
            </div>
            <div
                v-if="['chat-tts'].includes(item.modelType)"
                style="margin-bottom: 5px"
            >
              <a-descriptions
                  :column="2"
                  size="small"
                  layout="inline-vertical"
              >
                <a-descriptions-item label="类型">
                  {{ item.modelType }}
                </a-descriptions-item>
                <a-descriptions-item label="模型">
                  {{ item.chatTtsConfig?.configName }}
                </a-descriptions-item>
                <a-descriptions-item label="audio_seed">
                  {{ item.chatTtsConfig?.audio_seed_input }}
                </a-descriptions-item>
                <a-descriptions-item label="text_seed">
                  {{ item.chatTtsConfig?.text_seed_input }}
                </a-descriptions-item>
                <a-descriptions-item label="top_P">
                  {{ item.chatTtsConfig?.top_P }}
                </a-descriptions-item>
                <a-descriptions-item label="top_K">
                  {{ item.chatTtsConfig?.top_K }}
                </a-descriptions-item>
                <a-descriptions-item label="temperature">
                  {{ item.chatTtsConfig?.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_flag">
                  {{ item.chatTtsConfig?.refine_text_flag }}
                </a-descriptions-item>
                <a-descriptions-item label="refine_params">
                  <a-typography-text ellipsis>
                    {{ item.chatTtsConfig?.params_refine_text }}
                  </a-typography-text>
                </a-descriptions-item>
              </a-descriptions>
            </div>
            <div style="text-align: left">
              <a-space wrap>
                <a-dropdown-button
                    type="outline"
                    size="small"
                >
                  角色
                  <template #icon>
                    <icon-down/>
                  </template>
                  <template #content>
                    <a-doption @click="onRoleRename(item)">角色改名</a-doption>
                    <a-doption @click="onDeleteRole(item)">删除角色</a-doption>
                  </template>
                </a-dropdown-button>
                <a-button
                    type="outline"
                    size="small"
                    @click="roleSelectModel(item)"
                >
                  选择模型
                </a-button>
              </a-space>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>
    <div style="margin-top: 10px">
      <a-button
          type="outline"
          size="small"
          @click="addCommonRole"
      >
        添加预置角色
      </a-button>
    </div>

    <audio-select
        v-model:visible="modelSelectVisible"
        :model-config="currentRole"
        @model-select="modelSelect"
    />

    <a-modal
        v-model:visible="addCommonRoleVisible"
        title="添加预置角色"
        :width="600"
        @before-ok="handleAddCommonRoleBeforeOk"
        @close="handleAddCommonRoleClose"
        @cancel="handleAddCommonRoleClose"
    >
      <a-form
          ref="addCommonRoleFormRef"
          :model="currentRole"
      >
        <a-form-item label="角色" field="role" required>
          <a-input v-model="currentRole.role"/>
        </a-form-item>
        <a-form-item label="性别" field="gender">
          <a-select v-model="currentRole.gender">
            <a-option>男</a-option>
            <a-option>女</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="年龄" field="ageGroup">
          <a-select v-model="currentRole.ageGroup">
            <a-option>少年</a-option>
            <a-option>青年</a-option>
            <a-option>中年</a-option>
            <a-option>老年</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="model-type">
          <a-input v-model="currentRole.modelType" readonly/>
        </a-form-item>
        <div v-if="['gpt-sovits', 'fish-speech'].includes(currentRole.modelType)">
          <a-form-item label="model">
            <a-input v-model="computedAddFormModel" readonly/>
          </a-form-item>
          <a-form-item label="audio">
            <a-input v-model="computedAddFormAudio" readonly/>
          </a-form-item>
          <a-form-item label="ref-audio">
            <a-textarea v-model="computedAddFormRefAudio" readonly/>
          </a-form-item>
        </div>

        <div v-if="['edge-tts'].includes(currentRole.modelType)">
          <a-form-item label="model">
            <a-input v-model="computedAddFormModel" readonly/>
          </a-form-item>
        </div>

        <div v-if="['chat-tts'].includes(currentRole.modelType)">
          <a-form-item label="config_name">
            <a-input :model-value="currentRole.chatTtsConfig?.configName" readonly/>
          </a-form-item>

          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item
                  label="audio_seed"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-input-number :model-value="currentRole.chatTtsConfig?.audio_seed_input" readonly/>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                  label="text_seed"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-input-number :model-value="currentRole.chatTtsConfig?.text_seed_input" readonly/>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item
                  label="top_P"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-input-number :model-value="currentRole.chatTtsConfig?.top_P" readonly/>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                  label="top_K"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-input-number :model-value="currentRole.chatTtsConfig?.top_K" readonly/>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item
                  label="temperature"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-input-number :model-value="currentRole.chatTtsConfig?.temperature" readonly/>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                  label="refine_flag"
                  :label-col-props="{span: 12}"
                  :wrapper-col-props="{span: 12}"
              >
                <a-checkbox :value="currentRole.chatTtsConfig?.refine_text_flag" disabled/>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="refine_params">
            <a-input :model-value="currentRole.chatTtsConfig?.params_refine_text" readonly/>
          </a-form-item>
        </div>

      </a-form>
    </a-modal>

    <role-rename
        v-model:visible="roleRenameModalVisible"
        :role="currentRole"
        :role-type="'commonRole'"
        @success="refresh"
    />
  </div>
</template>

<style scoped>
:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>
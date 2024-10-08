<script setup lang="ts">
import {useRoute} from "vue-router";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {FormInstance, Message, Modal} from "@arco-design/web-vue";
import AudioSelect from '@/views/audio-select/index.vue'
import {AudioModelInfo} from "@/api/model.ts";
import {
  commonRoles as queryCommonRoles,
  createCommonRole,
  deleteCommonRole,
  TextRole,
  updateCommonRole,
} from "@/api/text-chapter.ts";
import {COMMON_ROLE_CHANGE} from "@/types/event-types.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import RoleEdit from "@/views/text/novel/chapter-content/components/RoleEdit.vue";
import emitter from "@/mitt";

const route = useRoute();

const modelSelectVisible = ref<boolean>(false);

const commonRoles = ref<TextRole[]>([])

const handleQueryCommonRoles = async () => {
  const {data} = await queryCommonRoles({
    projectId: route.query.projectId as string
  })
  commonRoles.value = data;
}

const ruleActiveKey = ref<(string | number)[]>([])
const openAllRule = () => {
  ruleActiveKey.value.length !== 0
      ? ruleActiveKey.value = []
      : ruleActiveKey.value = [...Array(commonRoles.value.length).keys()]
}

const currentRole = ref<TextRole>({} as TextRole);
const selectModelType = ref<'roleModelChange' | 'addCommonRole' | ''>('')
const roleSelectModel = (role: TextRole) => {
  selectModelType.value = 'roleModelChange'
  currentRole.value = role;
  modelSelectVisible.value = true
}

const addCommonRole = () => {
  selectModelType.value = 'addCommonRole'
  currentRole.value = {} as TextRole;
  modelSelectVisible.value = true
}

const refresh = () => {
  handleQueryCommonRoles();
}

const handleRoleModelChange = async (modelConfig: AudioModelInfo) => {
  const {msg} = await updateCommonRole({
    projectId: route.query.projectId as string,
    ...modelConfig,
    ids: [currentRole.value.id],
  })

  Message.success(msg);
  refresh()
}

const addCommonRoleFormRef = ref<FormInstance>()
const addCommonRoleVisible = ref<boolean>(false)
const handleAddCommonRole = (modelConfig: AudioModelInfo) => {
  currentRole.value = {
    ...modelConfig
  } as TextRole;
  addCommonRoleVisible.value = true;
}

const modelSelect = (modelConfig: AudioModelInfo) => {
  if (selectModelType.value === 'roleModelChange') {
    handleRoleModelChange(modelConfig);
  }
  if (selectModelType.value === 'addCommonRole') {
    handleAddCommonRole(modelConfig);
  }
}

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
        ...currentRole.value,
        projectId: route.query.projectId as string,
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
  currentRole.value = {} as TextRole;
  addCommonRoleFormRef.value?.clearValidate()
}

const roleRenameModalVisible = ref<boolean>(false)
const onRoleRename = (role: TextRole) => {
  currentRole.value = role;
  roleRenameModalVisible.value = true;
}

const onDeleteRole = (role: TextRole) => {
  Modal.error({
    title: `确认删除公共角色[${role.role}]?`,
    content: '',
    async onOk() {
      const {msg} = await deleteCommonRole({
        ...role,
        projectId: route.query.projectId as string,
      });
      Message.success(msg);
      refresh();
    },
  })
}

onMounted(() => {
  emitter?.on(COMMON_ROLE_CHANGE, handleQueryCommonRoles);
});

onBeforeUnmount(() => {
  emitter?.off(COMMON_ROLE_CHANGE, handleQueryCommonRoles);
});

watch(
    () => route.query.chapterId,
    () => {
      if (route.query.chapterId) {
        handleQueryCommonRoles();
      }
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <div>
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
          @change="(value: any) => (ruleActiveKey = value)"
      >
        <a-collapse-item v-for="(item, index) in commonRoles" :key="index">
          <template #header>
            <span>{{ item.role }}</span>
            <span style="margin-left: 10px; color: #707070">性别: </span>
            <span
                style="margin-left: 10px"
            >
              {{ item.gender ?? '未知' }}
            </span>
          </template>
          <div>
            <div>
              <a-descriptions
                  :column="1"
                  size="medium"
              >
                <a-descriptions-item label="类型">
                  {{ item.amType }}
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(item.amType)"
                    label="模型"
                >
                  <a-typography-text ellipsis>
                    {{ `${item.amMfGroup}/${item.amMfRole}` }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(item.amType)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{
                      item.amMcId === '-1'
                          ? '空'
                          : `${item.amMcName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['gpt-sovits'].includes(item.amType)"
                    label="音频"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}/${item.amPaAudio}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['fish-speech'].includes(item.amType)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{
                      item.amMcId === '-1'
                          ? '空'
                          : `${item.amMcName}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item
                    v-if="['fish-speech'].includes(item.amType)"
                    label="音频"
                >
                  <a-typography-text ellipsis>
                    {{
                      `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}/${item.amPaAudio}`
                    }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['chat-tts'].includes(item.amType)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ item.amMcName }}
                  </a-typography-text>
                </a-descriptions-item>

                <a-descriptions-item
                    v-if="['edge-tts'].includes(item.amType)"
                    label="配置"
                >
                  <a-typography-text ellipsis>
                    {{ voiceNameFormat(item.amMcName) }}
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
                    <a-doption @click="onRoleRename(item)">角色修改</a-doption>
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
        :audio-model-info="currentRole"
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
        <a-form-item label="年龄" field="age">
          <a-select v-model="currentRole.age">
            <a-option>少年</a-option>
            <a-option>青年</a-option>
            <a-option>中年</a-option>
            <a-option>老年</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="类型">
          <a-input v-model="currentRole.amType" readonly/>
        </a-form-item>
      </a-form>
    </a-modal>

    <role-edit
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
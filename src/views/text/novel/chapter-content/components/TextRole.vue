<script setup lang="ts">
import {useRoute} from "vue-router";
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {roles as queryRoles, saveToCommonRole, TextRole, updateRoleModel,} from "@/api/text-chapter.ts";
import {Message, Modal} from "@arco-design/web-vue";
import AudioSelect from '@/views/audio-select/index.vue'
import RoleDelete from "./RoleDelete.vue";
import {COMMON_ROLE_CHANGE, ROLE_CHANGE} from "@/types/event-types.ts";
import {AudioModelInfo} from "@/api/model.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import RoleEdit from "@/views/text/novel/chapter-content/components/RoleEdit.vue";
import {COSY_VOICE} from "@/types/model-types.ts";
import {AudioTaskEvent, WsEventType} from "@/types/global.ts";
import emitter from "@/mitt";

const route = useRoute();

const modelSelectVisible = ref<boolean>(false);
const roleRenameModalVisible = ref<boolean>(false);
const roleDeleteModalVisible = ref<boolean>(false);

const roles = ref<TextRole[]>([])

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  roles.value = data;
}

const ruleActiveKey = ref<(string | number)[]>([])
const openAllRule = () => {
  ruleActiveKey.value.length !== 0
      ? ruleActiveKey.value = []
      : ruleActiveKey.value = [...Array(roles.value.length).keys()]
}

const currentRole = ref<TextRole>({} as TextRole);
const roleSelectModel = (role: TextRole) => {
  currentRole.value = role;
  modelSelectVisible.value = true
}

const modelSelect = async (modelConfig: AudioModelInfo) => {
  const {msg} = await updateRoleModel({
    projectId: currentRole.value.projectId,
    chapterId: currentRole.value.chapterId,
    ...modelConfig,
    ids: [currentRole.value.id]
  })
  Message.success(msg);
  emitter?.emit(ROLE_CHANGE);
}

const onRoleRename = (role: TextRole) => {
  currentRole.value = role;
  roleRenameModalVisible.value = true;
}

const onDeleteRole = (role: TextRole) => {
  currentRole.value = role;
  roleDeleteModalVisible.value = true;
}

const onSaveToCommonRole = async (role: TextRole) => {
  const {data, msg} = await saveToCommonRole(role)
  if (!data) {
    Modal.confirm({
      title: '已存在预置角色',
      content: '是否覆盖预置角色配置？',
      okText: '是',
      cancelText: '否',
      async onOk() {
        const {msg} = await saveToCommonRole({
          ...role,
          coverCommonRole: true
        });
        Message.success(msg);
        emitter?.emit(COMMON_ROLE_CHANGE);
      }
    });
  } else {
    Message.success(msg);
    emitter?.emit(COMMON_ROLE_CHANGE);
  }
}

const refreshInner = () => {
  handleQueryRoles();
}

defineExpose({refreshInner})

const roleChangeEvent = () => {
  handleQueryRoles();
}

const wsDataHandler = (data: any) => {
  if (data?.type === WsEventType.chapter_reload) {
    handleQueryRoles();
  }
};

onMounted(() => {
  emitter?.on(ROLE_CHANGE, roleChangeEvent);
  emitter?.on(AudioTaskEvent.chapter_reload, wsDataHandler);
});

onBeforeUnmount(() => {
  emitter?.off(ROLE_CHANGE, roleChangeEvent);
  emitter?.off(AudioTaskEvent.chapter_reload, wsDataHandler);
});

watch(
    () => route.query.chapterId,
    () => {
      if (route.query.chapterId) {
        handleQueryRoles();
      }
    },
    {immediate: true}
);

</script>

<template>
  <div>
    <div>
      <a-button
          v-if="roles && roles.length"
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
        <a-collapse-item v-for="(item, index) in roles" :key="index">
          <template #header>
            <span>{{ `${item.role}(${item.roleCount})` }}</span>
            <span style="margin-left: 10px; color: #707070">性别: </span>
            <span
                style="margin-left: 10px"
            >
              {{ item.gender ?? '未知' }}
            </span>
          </template>
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
                    item.amMcId === '-1' || !item.amMcName
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
                    item.amMcId === '-1' || !item.amMcName
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

              <a-descriptions-item
                  v-if="[COSY_VOICE].includes(item.amType) && JSON.parse(item.amMcParamsJson)?.mode !== 'custom'"
                  label="角色"
              >
                <a-typography-text ellipsis>
                  {{ JSON.parse(item.amMcParamsJson)?.role }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="[COSY_VOICE].includes(item.amType) && JSON.parse(item.amMcParamsJson)?.mode === 'custom'"
                  label="音频"
              >
                <a-typography-text ellipsis>
                  {{
                    `${item.amPaGroup}/${item.amPaRole}/${item.amPaMood}/${item.amPaAudio}`
                  }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="[COSY_VOICE].includes(item.amType) && JSON.parse(item.amMcParamsJson)?.mode === 'advanced'"
                  label="提示"
              >
                <a-typography-text ellipsis>
                  {{ JSON.parse(item.amMcParamsJson)?.instruct }}
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
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
                    <a-doption @click="onSaveToCommonRole(item)">保存预置</a-doption>
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
    <audio-select
        v-model:visible="modelSelectVisible"
        :audio-model-info="currentRole"
        @model-select="modelSelect"
    />
    <role-edit
        v-model:visible="roleRenameModalVisible"
        :role="currentRole"
        :role-type="'role'"
    />
    <role-delete
        v-model:visible="roleDeleteModalVisible"
        :role="currentRole"
        :role-type="'role'"
    />
  </div>
</template>

<style scoped>
:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>
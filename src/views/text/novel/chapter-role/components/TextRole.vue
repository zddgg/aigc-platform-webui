<script setup lang="ts">
import {useRoute} from "vue-router";
import {inject, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {roles as queryRoles, saveToCommonRole, TextRole, updateRole,} from "@/api/text-chapter.ts";
import {Message, Modal} from "@arco-design/web-vue";
import AudioSelect from '@/views/audio-select/index.vue'
import RoleRename from "@/views/text/novel/chapter-role/components/RoleRename.vue";
import RoleDelete from "@/views/text/novel/chapter-role/components/RoleDelete.vue";
import {EventBus} from "@/vite-env";
import {COMMON_ROLE_CHANGE, ROLE_CHANGE} from "@/services/eventTypes.ts";
import {AudioModelConfig} from "@/api/model.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";

const route = useRoute();

const emits = defineEmits(['roleModelChange'])

const eventBus = inject<EventBus>('eventBus');

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

const modelSelect = async (modelConfig: AudioModelConfig) => {

  roles.value = roles.value.map(item => {
    if (item.role === currentRole.value.role) {
      return {
        ...item,
        ...modelConfig,
      }
    }
    return item;
  })

  const {msg} = await updateRole({
    ...currentRole.value,
    ...modelConfig,
  })
  Message.success(msg);
  eventBus?.emit(ROLE_CHANGE);
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
          cover: true
        });
        Message.success(msg);
        eventBus?.emit(COMMON_ROLE_CHANGE);
      }
    });
  } else {
    Message.success(msg);
    eventBus?.emit(COMMON_ROLE_CHANGE);
  }
}

const refreshInner = () => {
  handleQueryRoles();
}

defineExpose({refreshInner})

const roleChangeEvent = () => {
  handleQueryRoles();
}

onMounted(() => {
  eventBus?.on(ROLE_CHANGE, roleChangeEvent);
});

onBeforeUnmount(() => {
  eventBus?.off(ROLE_CHANGE, roleChangeEvent);
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
    <div v-if="!roles || !roles.length">
      <a-empty/>
    </div>
    <div v-else>
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
          @change="(value) => (ruleActiveKey = value)"
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
                {{ item.audioModelType }}
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="['gpt-sovits'].includes(item.audioModelType)"
                  label="模型"
              >
                <a-typography-text ellipsis>
                  {{ `${item.gptSovitsModel?.modelGroup}/${item.gptSovitsModel?.modelName}` }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="['gpt-sovits'].includes(item.audioModelType)"
                  label="配置"
              >
                <a-typography-text ellipsis>
                  {{
                    item.audioConfigId === '-1'
                        ? '空'
                        : `${item.gptSovitsConfig?.configName}`
                  }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="['gpt-sovits'].includes(item.audioModelType)"
                  label="音频"
              >
                <a-typography-text ellipsis>
                  {{
                    `${item.refAudio?.audioGroup}/${item.refAudio?.audioName}/${item.refAudio?.moodName}/${item.refAudio?.moodAudioName}`
                  }}
                </a-typography-text>
              </a-descriptions-item>

              <a-descriptions-item
                  v-if="['fish-speech'].includes(item.audioModelType)"
                  label="模型"
              >
                <a-typography-text ellipsis>
                  {{ `${item.fishSpeechModel?.modelGroup}/${item.fishSpeechModel?.modelName}` }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="['fish-speech'].includes(item.audioModelType)"
                  label="配置"
              >
                <a-typography-text ellipsis>
                  {{
                    item.audioConfigId === '-1'
                        ? '空'
                        : `${item.fishSpeechConfig?.configName}`
                  }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item
                  v-if="['fish-speech'].includes(item.audioModelType)"
                  label="音频"
              >
                <a-typography-text ellipsis>
                  {{ `${item.refAudio?.audioGroup}/${item.refAudio?.audioName}/${item.refAudio?.moodName}` }}
                </a-typography-text>
              </a-descriptions-item>

              <a-descriptions-item
                  v-if="['chat-tts'].includes(item.audioModelType)"
                  label="配置"
              >
                <a-typography-text ellipsis>
                  {{ item.chatTtsConfig?.configName }}
                </a-typography-text>
              </a-descriptions-item>

              <a-descriptions-item
                  v-if="['edge-tts'].includes(item.audioModelType)"
                  label="配置"
              >
                <a-typography-text ellipsis>
                  {{ voiceNameFormat(item.audioConfigId) }}
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
                    <a-doption @click="onRoleRename(item)">角色改名</a-doption>
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
        :audio-model-config="currentRole"
        @model-select="modelSelect"
    />
    <role-rename
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
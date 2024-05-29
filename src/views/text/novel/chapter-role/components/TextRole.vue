<script setup lang="ts">
import {useRoute} from "vue-router";
import {ref, watch} from "vue";
import {queryRoles, Role, roleModelChange} from "@/api/text.ts";
import {ModelSelect} from "@/api/ref-audio.ts";
import {Message} from "@arco-design/web-vue";
import AudioSelect from '@/views/audio-select/index.vue'
import RoleRename from "@/views/text/novel/chapter-role/components/RoleRename.vue";
import RoleDelete from "@/views/text/novel/chapter-role/components/RoleDelete.vue";

const route = useRoute();

const emits = defineEmits(['roleModelChange'])

const modelSelectVisible = ref<boolean>(false);
const roleRenameModalVisible = ref<boolean>(false);
const roleDeleteModalVisible = ref<boolean>(false);

const roles = ref<Role[]>([])

const handleQueryRoles = async () => {
  const {data} = await queryRoles({
    project: route.query.project as string,
    chapter: route.query.chapter as string,
  })
  roles.value = data;
}

const ruleActiveKey = ref<(string | number)[]>([])
const openAllRule = () => {
  ruleActiveKey.value.length !== 0
      ? ruleActiveKey.value = []
      : ruleActiveKey.value = [...Array(roles.value.length).keys()]
}

const currentRole = ref<Role>({} as Role);
const selectModelType = ref<'roleModelChange' | ''>('')
const roleSelectModel = (role: Role) => {
  selectModelType.value = 'roleModelChange'
  currentRole.value = role;
  modelSelectVisible.value = true
}

const refresh = () => {
  handleQueryRoles();
  emits('roleModelChange');
}

const modelSelect = async (modelSelect: ModelSelect) => {

  roles.value = roles.value.map(item => {
    if (item.role === currentRole.value.role) {
      return {
        ...item,
        ...modelSelect,
      }
    }
    return item;
  })

  const {msg} = await roleModelChange({
    chapter: {
      project: route.query.project as string,
      chapter: route.query.chapter as string,
    },
    role: {
      ...currentRole.value,
      ...modelSelect,
    }
  })
  Message.success(msg);
  refresh();
}

const onRoleRename = (role: Role) => {
  currentRole.value = role;
  roleRenameModalVisible.value = true;
}

const onDeleteRole = (role: Role) => {
  currentRole.value = role;
  roleDeleteModalVisible.value = true;
}


watch(
    () => route.query.chapter,
    () => {
      handleQueryRoles();
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
            <a-descriptions :column="1">
              <a-descriptions-item v-if="item.modelType" label="类型">
                {{ item.modelType }}
              </a-descriptions-item>
              <a-descriptions-item v-if="item.model && item.model.length" label="模型">
                {{ item.model.join('/') }}
              </a-descriptions-item>
              <a-descriptions-item v-if="item.modelType !== 'edge-tts' && item.audio && item.audio.length" label="音频">
                <a-typography-text ellipsis>
                  {{ item.audio.join('/') }}
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
        :model-select="currentRole"
        @change="modelSelect"
    />
    <role-rename
        v-model:visible="roleRenameModalVisible"
        :role="currentRole"
        :role-type="'role'"
        @success="refresh"
    />
    <role-delete
        v-model:visible="roleDeleteModalVisible"
        :role="currentRole"
        :role-type="'role'"
        @success="refresh"
    />
  </div>
</template>

<style scoped>
:deep(.arco-typography, p.arco-typography) {
  margin: 0;
}
</style>
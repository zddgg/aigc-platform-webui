<script setup lang="ts">
import {ref, watch} from "vue";
import {useRoute} from "vue-router";
import {queryRoleInferenceCache, TextRoleInference} from "@/api/text-chapter.ts";
import {PromptTemplate, queryPromptTemplates, queryTmServers, TmServer} from "@/api/tm-server.ts";
import {AudioRoleInfo} from "@/api/model.ts";
import {cloneDeep} from "lodash";

const route = useRoute();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});
const emits = defineEmits(['update:visible', 'success']);

const showModal = ref(false)
const inferenceType = ref<'online' | 'input'>('online')
const promptTemplates = ref<PromptTemplate[]>([])
const tmServers = ref<TmServer[]>([])
const currentPromptTemplate = ref<PromptTemplate>({} as PromptTemplate);
const currentTmServerId = ref<number | any>(null)

const textContent = ref<string>('')
const linesText = ref<string>('')
const roles = ref<AudioRoleInfo[]>([])
const rolesBack = ref<AudioRoleInfo[]>([])
const textRoleMoods = ref<TextRoleInference[]>([])
const textRoleMoodsBack = ref<TextRoleInference[]>([])

const handleBeforeOk = async (done: (closed: boolean) => void) => {

  const param = {
    inferenceType: inferenceType.value,
    tmServerId: currentTmServerId.value,
    systemPrompt: currentPromptTemplate.value.systemPrompt,
    userPrompt: currentPromptTemplate.value.userPrompt,
    textRoleInferences: textRoleMoods.value.map((item) => {
      const find = roles.value.find((item1) => item1.role === item.role);
      if (find) {
        item.gender = find.gender
        item.age = find.age
      }
      return item
    })
  }
  emits('success', param)
  done(true)
};

const close = () => {
  emits('update:visible', false);
}

const handleQueryRoleInferenceCache = async () => {
  const {data} = await queryRoleInferenceCache({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  });
  textContent.value = data?.content;
  linesText.value = data?.lines;
  roles.value = data?.roles;
  rolesBack.value = cloneDeep(data?.roles);
  textRoleMoods.value = data?.textRoleMoods;
  textRoleMoodsBack.value = cloneDeep(data?.textRoleMoods);
}

const handleQueryPromptTemplates = async () => {
  const {data} = await queryPromptTemplates({
    templateGroup: 'novel_role_inference'
  });
  promptTemplates.value = data;
  currentPromptTemplate.value = data.find((item) => item.isDefault) ?? {};
}

const handleQueryTmServers = async () => {
  const {data} = await queryTmServers();
  tmServers.value = data;
  currentTmServerId.value = data.find((item) => item.active)?.id
}

const changeRole4RoleTable = (value: string, rowIndex: number) => {

  if (textRoleMoods.value && textRoleMoodsBack.value) {
    const old = rolesBack.value[rowIndex]
    textRoleMoods.value = textRoleMoodsBack.value
        .map((item) => {
          if (item.role === old.role) {
            return {
              ...item,
              role: value,
            }
          } else {
            return item
          }
        });
    rolesBack.value = cloneDeep(roles.value)
    textRoleMoodsBack.value = cloneDeep(textRoleMoods.value)
  }
}

const changeRole4TextTable = (value: string) => {

  if (roles.value && rolesBack.value) {
    const find = roles.value.find((item) => item.role === value);
    if (!find) {
      roles.value.push({
        role: value,
        gender: '未知',
        age: '未知'
      } as any)
    }
    const textRoles = Array.from(new Set(textRoleMoods.value.map((item) => item.role)));
    roles.value = roles.value.filter((item) => textRoles.includes(item.role))
    rolesBack.value = cloneDeep(roles.value)
  }
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        inferenceType.value = 'online';
        promptTemplates.value = [];
        handleQueryRoleInferenceCache();
        handleQueryPromptTemplates();
        handleQueryTmServers();
      }
    },
    {immediate: true}
)
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="角色推理"
        :width="1080"
        :unmount-on-close="true"
        draggable
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-space direction="vertical" size="medium" style="width: 100%">
        <a-card :bordered="false" :body-style="{padding: 0}" style="display: flex">
          <a-radio-group v-model="inferenceType" class="custom-radio-group">
            <a-radio value="online">
              <template #radio="{ checked }">
                <a-space
                    class="custom-radio-card"
                    :class="{ 'custom-radio-card-checked': checked }"
                >
                  <div class="custom-radio-card-mask">
                    <div class="custom-radio-card-mask-dot"/>
                  </div>
                  <div class="custom-radio-card-title">
                    在线推理
                  </div>
                </a-space>
              </template>
            </a-radio>
            <a-radio value="input">
              <template #radio="{ checked }">
                <a-space
                    class="custom-radio-card"
                    :class="{ 'custom-radio-card-checked': checked }"
                >
                  <div class="custom-radio-card-mask">
                    <div class="custom-radio-card-mask-dot"/>
                  </div>
                  <div class="custom-radio-card-title">
                    自己输入推理结果
                  </div>
                </a-space>
              </template>
            </a-radio>
          </a-radio-group>
        </a-card>
        <a-divider :margin="0"/>
        <a-card v-if="inferenceType === 'online'" style="height: 510px" :bordered="false" :body-style="{padding: 0}">
          <div style="display: flex; width: 100%">
            <div style="width: 30%">
              <div style="font-size: 14px; margin-bottom: 8px">
                文本大模型
              </div>
              <div style="margin-bottom: 8px">
                <a-select v-model="currentTmServerId">
                  <a-option
                      v-for="(item, index) in tmServers"
                      :key="index"
                      :label="item.name"
                      :value="item.id"
                  >
                    <span>
                      {{ item.name }}
                    </span>
                    <a-tag v-if="item.active" color="green" size="small" style="margin-left: 10px">
                      默认
                    </a-tag>
                  </a-option>
                </a-select>
              </div>
              <div style="font-size: 14px; margin-bottom: 8px">
                提示词模板
              </div>
              <a-scrollbar type="track" style="height: 410px; overflow: auto; padding-right: 10px">
                <a-space direction="vertical" size="small" style="width: 100%">
                  <div
                      v-for="(item, index) in promptTemplates"
                      :key="index"
                      class="custom-radio-group"
                      @click="() => (currentPromptTemplate = item)"
                  >
                    <div
                        class="custom-radio-card"
                        :class="{ 'custom-radio-card-checked': currentPromptTemplate?.id === item.id }"
                        style="width: 100%; display: flex; align-items: center;"
                    >
                      <div class="custom-radio-card-mask" style="flex-shrink: 0; margin-right: 10px;">
                        <div class="custom-radio-card-mask-dot"></div>
                      </div>
                      <div class="custom-radio-card-title" style="flex-grow: 1;">
                        {{ item.templateName }}
                      </div>
                      <div v-if="item.isDefault" style="flex-shrink: 0; margin-left: 10px;">
                        <a-tag color="green" size="small">
                          默认
                        </a-tag>
                      </div>
                    </div>
                  </div>
                </a-space>
              </a-scrollbar>
            </div>
            <div style="flex: 1; margin-left: 20px">
              <a-form :model="{}" layout="vertical">
                <a-form-item label="系统指令">
                  <n-input
                      v-model:value="currentPromptTemplate.systemPrompt"
                      type="textarea"
                      placeholder="系统指令"
                      :autosize="{minRows: 2, maxRows: 2}"
                  />
                </a-form-item>
                <a-form-item>
                  <template #label>
                    <span>
                      用户指令
                    </span>
                    <a-popover position="right" :content-style="{padding: '0'}">
                      <span style="margin-left: 20px; font-size: 12px; color: #165dff">
                        <span>
                          <icon-list/>
                        </span>
                        可用参数
                      </span>
                      <template #content>
                        <a-scrollbar style="max-height: 500px; overflow: auto; padding-right: 10px">
                          <a-doption
                              v-for="(item, index) in [
                                '@{小说内容}',
                                '@{对话列表}',
                            ]"
                              :key="index"
                          >
                            {{ item }}
                            <a-popover position="right">
                              <icon-eye style="margin-left: 5px"/>
                              <template #content>
                                <div
                                    style="width: 300px; height: 500px; overflow: auto; white-space: pre-wrap; word-wrap: break-word;">
                                  <span v-if="item === '@{小说内容}'">
                                    {{ textContent }}
                                  </span>
                                  <span v-if="item === '@{对话列表}'">
                                    {{ linesText }}
                                  </span>
                                </div>
                              </template>
                            </a-popover>
                          </a-doption>
                        </a-scrollbar>
                      </template>
                    </a-popover>
                    <span style="margin-left: 20px; font-size: 12px">
                      下面输入框中输入@触发
                    </span>
                  </template>
                  <n-mention
                      v-model:value="currentPromptTemplate.userPrompt"
                      :options="[
                          {label: '{小说内容}', value: '{小说内容}'},
                          {label: '{对话列表}', value: '{对话列表}'},
                      ]"
                      type="textarea"
                      placeholder="用户指令"
                      :autosize="{minRows: 16, maxRows: 16}"
                  />
                </a-form-item>
              </a-form>
            </div>
          </div>
        </a-card>
        <div v-if="inferenceType === 'input'" style="height: 510px; display: flex;">
          <div style="flex: 0 0 35%; overflow: auto;">
            <a-table
                :data="roles"
                :columns="[
                    {title: '角色', dataIndex: 'role', slotName: 'role'},
                    {title: '性别', dataIndex: 'gender', slotName: 'gender', width: 110},
                    {title: '年龄', dataIndex: 'age', slotName: 'age', width: 110},
                ]"
                :bordered="{cell:true}"
                :pagination="false"
                :scroll="{y: '100%'}"
                :scrollbar="true"
            >
              <template #role="{ record, rowIndex }">
                <a-input
                    v-model="record.role"
                    @change="(value: any) => changeRole4RoleTable(value, rowIndex)"
                />
              </template>
              <template #gender="{ record }">
                <a-select v-model="record.gender" allow-create>
                  <a-option>男</a-option>
                  <a-option>女</a-option>
                  <a-option>未知</a-option>
                </a-select>
              </template>
              <template #age="{ record }">
                <a-select v-model="record.age" allow-create>
                  <a-option>少年</a-option>
                  <a-option>青年</a-option>
                  <a-option>中年</a-option>
                  <a-option>老年</a-option>
                  <a-option>未知</a-option>
                </a-select>
              </template>
            </a-table>
          </div>
          <div style="flex-grow: 1; margin-left: 10px; overflow: auto;">
            <a-table
                :data="textRoleMoods"
                :columns="[
                    {title: '文本', dataIndex: 'text'},
                    {title: '角色', dataIndex: 'role', slotName: 'role', width: 140},
                    {title: '情感', dataIndex: 'mood', slotName: 'mood', width: 120},
                    ]"
                :bordered="{cell:true}"
                :pagination="false"
                :scroll="{y: '100%'}"
                :scrollbar="true"
            >
              <template #role="{ record }">
                <a-select
                    v-model="record.role"
                    allow-create
                    @change="(value: any) => changeRole4TextTable(value as string)"
                >
                  <a-option
                      v-for="(item, index) in roles"
                      :key="index"
                      :label="item.role"
                      :value="item.role"
                  />
                </a-select>
              </template>
              <template #mood="{ record }">
                <a-select v-model="record.mood" allow-create>
                  <a-option>中立</a-option>
                  <a-option>开心</a-option>
                  <a-option>吃惊</a-option>
                  <a-option>难过</a-option>
                  <a-option>厌恶</a-option>
                  <a-option>生气</a-option>
                  <a-option>恐惧</a-option>
                </a-select>
              </template>
            </a-table>
          </div>
        </div>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped>

.custom-radio-group {
  cursor: pointer
}

.custom-radio-group :deep(.arco-radio) {
  padding: 0;
}

.custom-radio-group :deep(.arco-typography, p.arco-typography) {
  margin: 0;
}

.custom-radio-card {
  padding: 10px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  box-sizing: border-box;
}

.custom-radio-card-mask {
  height: 14px;
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  border: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.custom-radio-card-mask-dot {
  width: 8px;
  height: 8px;
  border-radius: 100%;
}

.custom-radio-card-title {
  color: var(--color-text-1);
  font-size: 14px;
  font-weight: bold;
}

.custom-radio-card:hover,
.custom-radio-card-checked,
.custom-radio-card:hover .custom-radio-card-mask,
.custom-radio-card-checked .custom-radio-card-mask {
  border-color: rgb(var(--primary-6));
}

.custom-radio-card-checked {
  background-color: var(--color-primary-light-1);
}

.custom-radio-card:hover .custom-radio-card-title,
.custom-radio-card-checked .custom-radio-card-title {
  color: rgb(var(--primary-6));
}

.custom-radio-card-checked .custom-radio-card-mask-dot {
  background-color: rgb(var(--primary-6));
}

</style>
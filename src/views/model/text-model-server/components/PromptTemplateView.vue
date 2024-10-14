<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {deletePromptTemplate, PromptTemplate, queryPromptTemplates, setDefaultPromptTemplate} from "@/api/tm-server.ts";
import {Message, TableColumnData} from "@arco-design/web-vue";
import PromptTemplateEdit from "@/views/model/text-model-server/components/PromptTemplateEdit.vue";

const promptTemplates = ref<PromptTemplate[]>([])
const selectGroup = ref<string | any>(null)
const selectIsDefault = ref<number>(-1);
const selectName = ref<string | any>(null)
const currentPromptTemplate = ref<PromptTemplate | any>(null)
const promptTemplateEditModalVisible = ref<boolean>(false)

const columns: TableColumnData[] = [
  {
    title: '序号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '名称',
    dataIndex: 'templateName',
    width: 200
  },
  {
    title: '分组',
    slotName: 'templateGroup',
    width: 200
  },
  {
    title: '是否默认',
    slotName: 'isDefault',
    width: 100
  },
  {
    title: '系统指令',
    slotName: 'systemPrompt',
  },
  {
    title: '用户指令',
    slotName: 'userPrompt',
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 100
  }
]

const handleQueryPromptTemplates = async () => {
  const {data} = await queryPromptTemplates({});
  promptTemplates.value = data;
}

const computedPromptTemplates = computed(() => {
  let tmp = promptTemplates.value;
  if (selectGroup.value) {
    tmp = tmp.filter((item) => item.templateGroup === selectGroup.value)
  }
  if ([0, 1].includes(selectIsDefault.value)) {
    tmp = tmp.filter((item) => item.isDefault === (selectIsDefault.value === 1))
  }
  if (selectName.value) {
    tmp = tmp.filter((item) => item.templateName && item.templateName.includes(selectName.value))
  }
  return tmp
})

const highlightedParams = (text: string) => {
  const params = ['@{小说内容}', '@{对话列表}']
  let formattedText = text;
  params.forEach(param => {
    const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义特殊字符
    const regex = new RegExp(`(${escapedParam})`, 'gi');
    formattedText = formattedText.replace(regex, `<span style="color: #165dff; cursor: pointer">$1</span>`);
  });
  return formattedText;
}

const reset = () => {
  selectGroup.value = ''
  selectIsDefault.value = -1
  selectName.value = ''
}

const handleDeletePromptTemplate = async (promptTemplate: PromptTemplate) => {
  const {msg} = await deletePromptTemplate(promptTemplate)
  Message.success(msg)
  await handleQueryPromptTemplates()
}

const handleSetDefaultPromptTemplate = async (promptTemplate: PromptTemplate) => {
  const {msg} = await setDefaultPromptTemplate(promptTemplate)
  Message.success(msg)
  await handleQueryPromptTemplates()
}

onMounted(() => {
  handleQueryPromptTemplates();
})
</script>

<template>
  <div style="margin-top: 10px">
    <a-form :model="{}">
      <a-row :gutter="20">
        <a-col :span="2">
          <a-button type="primary" @click="() => {
            currentPromptTemplate = null;
            promptTemplateEditModalVisible = true;
          }">
            新增提示词模板
          </a-button>
        </a-col>
        <a-col :span="6">
          <a-form-item label="模板分组">
            <a-select v-model="selectGroup" allow-clear>
              <a-option label="小说角色推理" value="novel_role_inference"/>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="是否默认">
            <a-select v-model="selectIsDefault" allow-clear>
              <a-option label="" :value="-1"/>
              <a-option label="是" :value="1"/>
              <a-option label="否" :value="0"/>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="模板名称">
            <a-input v-model="selectName"/>
          </a-form-item>
        </a-col>
        <a-col :span="2">
          <a-space size="medium">
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-form>
    <a-table
        :data="computedPromptTemplates"
        :columns="columns"
        :bordered="{cell:true}"
        :pagination="false"
        :scrollbar="true"
    >
      <template #templateGroup="{ record }">
        <span v-if="record.templateGroup === 'novel_role_inference'">
          小说角色推理
        </span>
      </template>
      <template #isDefault="{ record }">
        <a-tag v-if="record.isDefault" color="green" size="medium">
          默认模板
        </a-tag>
        <a-tag v-else color="blue" size="medium">
          否
        </a-tag>
      </template>
      <template #systemPrompt="{ record }">
        <div
            style="overflow: auto; white-space: pre-wrap; word-wrap: break-word;"
            v-html="highlightedParams(record.systemPrompt)"
        />
      </template>
      <template #userPrompt="{ record }">
        <div
            style="overflow: auto; white-space: pre-wrap; word-wrap: break-word;"
            v-html="highlightedParams(record.userPrompt)"
        />
      </template>
      <template #operations="{ record }">
        <a-space direction="vertical">
          <a-button
              v-if="!record.isPreset"
              size="small"
              type="outline"
              @click="() => {
                currentPromptTemplate = record;
                promptTemplateEditModalVisible = true;
              }"
          >
            编辑模板
          </a-button>
          <a-popconfirm
              type="error"
              content="确认删除?"
              @ok="handleDeletePromptTemplate(record)"
          >
            <a-button
                v-if="!record.isPreset"
                size="small"
                type="outline"
                status="danger"
            >
              删除模板
            </a-button>
          </a-popconfirm>
          <a-button
              v-if="!record.isDefault"
              size="small"
              type="outline"
              status="success"
              @click="handleSetDefaultPromptTemplate(record)"
          >
            设置默认
          </a-button>
        </a-space>
      </template>
    </a-table>
  </div>
  <prompt-template-edit
      v-model:visible="promptTemplateEditModalVisible"
      :prompt-template="currentPromptTemplate"
      @success="handleQueryPromptTemplates"
  />
</template>

<style scoped>

</style>
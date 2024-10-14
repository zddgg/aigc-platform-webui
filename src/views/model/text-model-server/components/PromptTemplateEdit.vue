<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {editPromptTemplate, PromptTemplate} from "@/api/tm-server.ts";
import {FormInstance} from "@arco-design/web-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  promptTemplate: {
    type: Object as PropType<PromptTemplate>,
    default: null
  }
});
const emits = defineEmits(['update:visible', 'success']);

const formRef1 = ref<FormInstance>();
const formRef2 = ref<FormInstance>();

const showModal = ref(false)
const promptTemplate = ref<PromptTemplate | any>(null)

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res1 = await formRef1.value?.validate();
  const res2 = await formRef2.value?.validate();
  if (!res1 && !res2) {
    await editPromptTemplate(promptTemplate.value);
    done(true)
    emits('success')
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        promptTemplate.value = {...props.promptTemplate}
        console.log(props.promptTemplate)
      }
    },
    {immediate: true}
)
</script>

<template>
  <a-modal
      v-model:visible="showModal"
      :title="props.promptTemplate ? '编辑提示词模板' : '新增提示词模板'"
      :width="960"
      :unmount-on-close="true"
      draggable
      @before-ok="handleBeforeOk"
      @close="close"
      @cancel="close"
  >
    <a-form
        ref="formRef1"
        :model="promptTemplate"
        :label-col-props="{span: 4}"
        :wrapper-col-props="{span: 20 }"
    >
      <a-form-item
          label="模板名称"
          field="templateName"
          :rules="[{required:true,message:'模板名称不能为空'}]"
      >
        <a-input v-model="promptTemplate.templateName"/>
      </a-form-item>
      <a-form-item
          label="模板分组"
          field="templateGroup"
          :rules="[{required:true,message:'模板分组不能为空'}]"
      >
        <a-select v-model="promptTemplate.templateGroup">
          <a-option label="小说角色推理" value="novel_role_inference"/>
        </a-select>
      </a-form-item>
    </a-form>
    <a-form
        ref="formRef2"
        :model="promptTemplate"
        layout="vertical"
    >
      <a-row :gutter="20">
        <a-col :span="12">
          <a-form-item
              label="系统指令"
              field="systemPrompt"
              :rules="[{required:true,message:'系统指令不能为空'}]"
          >
            <n-input
                v-model:value="promptTemplate.systemPrompt"
                type="textarea"
                :autosize="{minRows: 3, maxRows: 20}"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
              label="用户指令"
              field="userPrompt"
              :rules="[{required:true,message:'用户指令不能为空'}]"
          >
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
                        v-for="(item, index) in ['@{小说内容}', '@{对话列表}']"
                        :key="index"
                    >
                      {{ item }}
                      <a-popover position="right">
                        <icon-eye style="margin-left: 5px"/>
                        <template #content>
                          <div
                              style="width: 300px; height: 500px; overflow: auto; white-space: pre-wrap; word-wrap: break-word;"
                          >
                            <span v-if="item === '@{小说内容}'">
                              {{ 22 }}
                            </span>
                            <span v-if="item === '@{对话列表}'">
                              {{ 111 }}
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
                v-model:value="promptTemplate.userPrompt"
                :options="[
                    {label: '{小说内容}', value: '{小说内容}'},
                    {label: '{对话列表}', value: '{对话列表}'},
                ]"
                type="textarea"
                placeholder="用户指令"
                :autosize="{minRows: 20, maxRows: 20}"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<style scoped>

</style>
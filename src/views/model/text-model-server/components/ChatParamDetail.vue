<script setup lang="ts">
import {computed, PropType, ref, watch} from "vue";
import {FormInstance, Message} from "@arco-design/web-vue";
import {TmServer, templateList as queryTemplateList, updateModelChatConfig} from "@/api/tm-server.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  chatModelConfig: {
    type: Object as PropType<TmServer>,
    default: {}
  }
})

const emits = defineEmits(['update:visible', 'success']);
const showModal = ref(false);
const moreConfig = ref(false);
const formRef = ref<FormInstance>();
const form = ref<TmServer>({} as TmServer);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await updateModelChatConfig(form.value)
    Message.success(msg);
    done(true);
    emits('success')
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
}

const chatTemplates = ref<TmServer[]>([]);

const handleChatTemplate = async () => {
  const {data} = await queryTemplateList();
  chatTemplates.value = data;
}

const chatTemplateChange = (value: any) => {
  const find = chatTemplates.value.find(item => item.templateName === value);
  if (find) {
    form.value = {
      ...form.value,
      interfaceType: find.interfaceType,
      host: find.host,
      path: find.path,
      apiKey: find.apiKey,
      model: find.model,
      temperature: find.temperature,
      maxTokens: find.maxTokens,
      apiSecret: find.apiSecret,
      appId: find.appId,
    }
  }
}

const interfaceTypeOptions = computed(() => {
  const result = Array.from(new Set(chatTemplates.value.map(item => item.interfaceType)
      .filter(item => !!item)))
  if (result && result.length > 0) {
    return result
  }
  return ['OpenAi', 'Spark', 'Qwen']
})

watch(
    () => props.visible,
    () => {
      if (props.visible) {
        handleChatTemplate();
        formRef.value?.resetFields();
        form.value = {...props.chatModelConfig}
        moreConfig.value = false;
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
        :title="form.id ? form.name : '添加文本大模型'"
        :width="700"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form
          ref="formRef"
          :model="form"
          :label-col-props="{ span: 6 }"
          :wrapper-col-props="{ span: 18 }"
      >
        <a-form-item field="name" label="名称" required>
          <a-input v-model="form.name"/>
        </a-form-item>
        <a-row>
          <a-col :span="12">
            <a-form-item
                field="interfaceType"
                label="接口类型"
                :label-col-props="{ span: 12 }"
                :wrapper-col-props="{ span: 12 }"
                required
            >
              <a-select
                  v-model="form.interfaceType"
                  :options="interfaceTypeOptions"
              >
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
                field="interfaceType"
                label="模板"
                :label-col-props="{ span: 12 }"
                :wrapper-col-props="{ span: 12 }"
            >
              <a-select
                  :options="chatTemplates.map(item => item.templateName).filter(item => !!item)"
                  allow-clear
                  @change="chatTemplateChange"
              >
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="host" label="host" required>
          <a-input v-model="form.host"/>
        </a-form-item>
        <a-form-item field="path" label="path" required>
          <a-input v-model="form.path"/>
        </a-form-item>
        <a-form-item field="apiKey" label="apiKey" required>
          <a-input-password v-model="form.apiKey"/>
        </a-form-item>
        <a-form-item v-if="form.interfaceType === 'Spark'" field="apiSecret" label="apiSecret" required>
          <a-input-password v-model="form.apiSecret"/>
        </a-form-item>
        <a-form-item v-if="form.interfaceType === 'Spark'" field="appId" label="appId" required>
          <a-input-password v-model="form.appId"/>
        </a-form-item>
        <a-form-item field="model" label="model" required>
          <a-input v-model="form.model"/>
        </a-form-item>
        <div v-if="moreConfig">
          <a-row>
            <a-col :span="12">
              <a-form-item field="temperature" label="temperature"
                           :label-col-props="{ span: 12 }"
                           :wrapper-col-props="{ span: 12 }"
              >
                <a-input-number v-model="form.temperature"/>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="maxTokens" label="maxTokens"
                           :label-col-props="{ span: 12 }"
                           :wrapper-col-props="{ span: 12 }"
              >
                <a-input-number v-model="form.maxTokens"/>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
        <div style="text-align: right">
          <a-button type="outline" size="mini"
                    @click="() => (moreConfig = !moreConfig)"
          >
            {{ moreConfig ? '收起' : '更多配置' }}
            <icon-up v-if="moreConfig"/>
            <icon-down v-else/>
          </a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
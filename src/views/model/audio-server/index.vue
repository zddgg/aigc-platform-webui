<script setup lang="ts">
import {onMounted, ref} from "vue";
import {AudioServerConfig, list as queryAudioServerConfigs, updateConfig} from "@/api/audio-server-config.ts";
import {FormInstance, Message} from "@arco-design/web-vue";

const formRef = ref<FormInstance>();
const audioServers = ref<AudioServerConfig[]>([]);
const configModalVisible = ref(false);
const form = ref<AudioServerConfig>({} as AudioServerConfig);

const handleQueryAudioServerConfig = async () => {
  const {data} = await queryAudioServerConfigs();
  audioServers.value = data;
}

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await updateConfig(form.value);
    Message.success(msg);
    done(true);
    await handleQueryAudioServerConfig();
  } else {
    done(false);
  }
}

onMounted(() => {
  handleQueryAudioServerConfig();
})
</script>

<template>
  <div>
    <a-space direction="vertical" size="large" style="width: 100%;">
      <a-card title="音频生成服务" :bordered="false">
        <a-grid :row-gap="24" :col-gap="24" :cols="2">
          <a-grid-item
              v-for="(item, index) in audioServers"
              :key="index"
          >
            <a-card style="border: #a9a9a9 1px solid">
              <a-descriptions :bordered="true" :column="1" :title="item.name">
                <a-descriptions-item label="host">
                  <a-typography-text>
                    {{ item.host }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item label="path">
                  <a-typography-text>
                    {{ item.path }}
                  </a-typography-text>
                </a-descriptions-item>
                <a-descriptions-item label="apiVersion">
                  <a-typography-text>
                    {{ item.apiVersion }}
                  </a-typography-text>
                </a-descriptions-item>
              </a-descriptions>
              <div style="text-align: right; margin-top: 10px">
                <a-button
                    type="outline"
                    size="mini"
                    @click="() => {
                      form = {...item}
                      configModalVisible = true;
                    }"
                >
                  编辑
                </a-button>
              </div>
            </a-card>
          </a-grid-item>
        </a-grid>
      </a-card>
    </a-space>
    <a-modal
        v-model:visible="configModalVisible"
        :title="form.name"
        @before-ok="handleBeforeOk"
        @close="() => {
          formRef?.resetFields();
        }"
        @cancel="() => {
          formRef?.resetFields();
        }"
    >
      <a-form
          ref="formRef"
          :model="form"
      >
        <a-form-item label="host" field="host" required>
          <a-input v-model="form.host"/>
        </a-form-item>
        <a-form-item label="path" field="path">
          <a-input v-model="form.path"/>
        </a-form-item>
        <a-form-item label="apiVersion" field="apiVersion">
          <a-select v-model="form.apiVersion">
            <a-option>v1</a-option>
            <a-option>v2</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
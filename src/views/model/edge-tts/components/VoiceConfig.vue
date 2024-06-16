<script setup lang="ts">
import {onMounted, ref} from "vue";
import {settings as querySettings, EdgeTtsSetting, updateSetting} from "@/api/edge-tts.ts";
import {FormInstance, Message} from "@arco-design/web-vue";

const edgeTtsSettings = ref<EdgeTtsSetting[]>([]);
const formRef = ref<FormInstance>();
const voiceConfigModalVisible = ref(false);

const handleQuerySettings = async () => {
  const {data} = await querySettings();
  edgeTtsSettings.value = data.sort((a, b) => (b.showFlag ? 1 : 0) - (a.showFlag ? 1 : 0));
}

const form = ref<EdgeTtsSetting>({} as EdgeTtsSetting);

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await updateSetting(form.value);
    Message.success(msg);
    done(true);
    await handleQuerySettings();
  } else {
    done(false);
  }
}

onMounted(() => {
  handleQuerySettings();
})
</script>

<template>
  <div>
    <a-grid :col-gap="20" :row-gap="20" :cols="3">
      <a-grid-item
          v-for="(item, index) in edgeTtsSettings"
          :key="index"
      >
        <a-card
            hoverable
        >
          <a-descriptions
              :column="1"
              bordered
          >
            <template #title>
              {{ item.enName }}
            </template>
            <a-descriptions-item label="展示名称">
              <a-typography-text>
                {{ item.zhName }}
              </a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="语音文本">
              <a-typography-text>
                {{ item.text }}
              </a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="是否展示">
              <a-switch
                  :model-value="item.showFlag"
                  checked-text="是"
                  :checked-value="true"
                  unchecked-text="否"
                  :unchecked-value="false"
                  type="round"
                  :before-change="() => false"
              />
            </a-descriptions-item>
          </a-descriptions>
          <div style="text-align: right; margin-top: 10px">
            <a-button
                type="outline"
                size="mini"
                @click="() => {
                      form = {...item}
                      voiceConfigModalVisible = true;
                    }"
            >
              编辑
            </a-button>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>
    <a-modal
        v-model:visible="voiceConfigModalVisible"
        :title="form.enName"
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
        <a-form-item label="展示名称" field="zhName">
          <a-input v-model="form.zhName"/>
        </a-form-item>
        <a-form-item label="语音文本" field="text">
          <a-input v-model="form.text"/>
        </a-form-item>
        <a-form-item label="是否展示" field="showFlag">
          <a-switch
              v-model="form.showFlag"
              checked-text="是"
              :checked-value="true"
              unchecked-text="否"
              :unchecked-value="false"
              type="round"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>

</style>
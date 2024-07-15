<script setup lang="ts">
import {ref} from "vue";
import ConfigParamList from "@/views/model/gpt-sovits/components/ConfigParamList.vue";
import AudioCreate from "@/views/model/gpt-sovits/components/AudioCreate.vue";
import ModelList from "@/views/model/gpt-sovits/components/ModelList.vue";

const activeKey = ref('1');

const configEditId = ref<number | undefined>(undefined);
const configEdit = (id: number | undefined) => {
  configEditId.value = id;
  activeKey.value = '3';
}

const handleTabClick = (key: any) => {
  if (key === '3') {
    configEditId.value = undefined;
  }
}
</script>

<template>
  <div>
    <n-tabs
        v-model:value="activeKey"
        @tabClick="handleTabClick"
        type="card"
        size="small"
        animated
    >
      <n-tab-pane name="1" tab="模型列表">
        <model-list/>
      </n-tab-pane>
      <n-tab-pane name="2" tab="配置参数列表">
        <config-param-list @config-edit="configEdit"/>
      </n-tab-pane>
      <n-tab-pane name="3" tab="音频生成">
        <audio-create :config-edit-id="configEditId"/>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
</style>
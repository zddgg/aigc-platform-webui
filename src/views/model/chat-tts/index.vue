<script setup lang="ts">
import {ref} from "vue";
import AudioCreate from "@/views/model/chat-tts/components/AudioCreate.vue";
import ConfigParamList from "@/views/model/chat-tts/components/ConfigParamList.vue";

const activeKey = ref('1');

const configEditId = ref<number | undefined>(undefined);
const configEdit = (id: number | undefined) => {
  configEditId.value = id;
  activeKey.value = '2';
}

const handleTabClick = (key: any) => {
  if (key === '2') {
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
      <n-tab-pane name="1" tab="配置参数列表">
        <config-param-list @config-edit="configEdit"/>
      </n-tab-pane>
      <n-tab-pane name="2" tab="音频生成">
        <audio-create :config-edit-id="configEditId"/>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.icon-hover {
  padding: 2px;
  border-radius: 2px;
  margin-left: 10px;
}

.icon-hover:hover {
  background-color: #e5e5e5;
}
</style>
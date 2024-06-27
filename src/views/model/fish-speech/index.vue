<script setup lang="ts">
import {ref} from "vue";
import ConfigParamList from "@/views/model/fish-speech/components/ConfigParamList.vue";
import AudioCreate from "@/views/model/fish-speech/components/AudioCreate.vue";
import ModelList from "@/views/model/fish-speech/components/ModelList.vue";
import {TabPane, Tabs} from 'ant-design-vue';
import {refreshCache} from "@/api/fish-speech.ts";

const activeKey = ref('1');

const modelListRef = ref<{ refresh: Function } | null>(null);

const handleRefreshCache = async () => {
  await refreshCache();
  modelListRef.value?.refresh();
}

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
    <tabs
        v-model:activeKey="activeKey"
        :destroyInactiveTabPane="true"
        @tabClick="handleTabClick"
    >
      <template #rightExtra>
        <a-button
            v-if="activeKey === '1'"
            type="outline"
            style="margin-right: 20px"
            @click="handleRefreshCache"
        >
          刷新缓存
        </a-button>
      </template>
      <tab-pane key="1" tab="模型列表">
        <model-list ref="modelListRef"/>
      </tab-pane>
      <tab-pane key="2" tab="配置参数列表">
        <config-param-list @config-edit="configEdit"/>
      </tab-pane>
      <tab-pane key="3" tab="音频生成">
        <audio-create :config-edit-id="configEditId"/>
      </tab-pane>
    </tabs>
  </div>
</template>

<style scoped>
</style>
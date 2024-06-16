<script setup lang="ts">
import {ref} from "vue";
import ConfigParamList from "@/views/model/fish-speech/components/ConfigParamList.vue";
import AudioCreate from "@/views/model/fish-speech/components/AudioCreate.vue";
import ModelList from "@/views/model/fish-speech/components/ModelList.vue";
import {TabPane, Tabs} from 'ant-design-vue';

const activeKey = ref('1');
</script>

<template>
  <div>
    <tabs v-model:activeKey="activeKey">
      <tab-pane key="1" tab="模型列表">
        <model-list/>
      </tab-pane>
      <tab-pane key="2" tab="配置参数列表">
        <config-param-list/>
      </tab-pane>
      <tab-pane key="3" tab="音频生成">
        <audio-create/>
      </tab-pane>
    </tabs>
  </div>
</template>

<style scoped>
</style>
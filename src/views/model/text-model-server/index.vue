<script setup lang="ts">
import TmServerConfig from "@/views/model/text-model-server/components/TmServerConfig.vue";
import PromptTemplateView from "@/views/model/text-model-server/components/PromptTemplateView.vue";
</script>

<template>
  <div>
    <n-tabs type="card" size="small" animated>
      <n-tab-pane name="1" tab="服务配置">
        <tm-server-config/>
      </n-tab-pane>
      <n-tab-pane name="2" tab="提示词模板">
        <prompt-template-view/>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
</style>
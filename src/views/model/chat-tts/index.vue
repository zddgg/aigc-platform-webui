<script setup lang="ts">
import AudioCreate from "@/views/model/chat-tts/components/AudioCreate.vue";
import ConfigParamList from "@/views/model/chat-tts/components/ConfigParamList.vue";
</script>

<template>
  <div>
    <a-tabs default-active-key="1">
      <a-tab-pane key="1" title="配置参数列表">
        <config-param-list/>
      </a-tab-pane>
      <a-tab-pane key="2" title="音频生成">
        <audio-create/>
      </a-tab-pane>
    </a-tabs>
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
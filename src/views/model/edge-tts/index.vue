<script setup lang="ts">
import VoiceList from "@/views/model/edge-tts/components/VoiceList.vue";
import VoiceConfig from "@/views/model/edge-tts/components/VoiceConfig.vue";

</script>

<template>
  <div>
    <a-tabs default-active-key="1">
      <a-tab-pane key="1" title="声音列表">
        <voice-list/>
      </a-tab-pane>
      <a-tab-pane key="2" title="声音配置">
        <voice-config/>
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
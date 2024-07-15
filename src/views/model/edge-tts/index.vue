<script setup lang="ts">
import VoiceList from "@/views/model/edge-tts/components/VoiceList.vue";
import VoiceConfig from "@/views/model/edge-tts/components/VoiceConfig.vue";
import AudioCreate from "@/views/model/edge-tts/components/AudioCreate.vue";
</script>

<template>
  <div>
    <n-tabs type="card" size="small" animated>
      <n-tab-pane name="1" tab="声音列表">
        <voice-list/>
      </n-tab-pane>
      <n-tab-pane name="2" tab="声音配置">
        <voice-config/>
      </n-tab-pane>
      <n-tab-pane name="3" tab="音频生成">
        <audio-create/>
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
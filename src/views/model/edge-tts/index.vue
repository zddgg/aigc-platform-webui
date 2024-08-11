<script setup lang="ts">
import ConfigParamList from "@/views/model/edge-tts/components/ConfigParamList.vue";
import AudioCreate from "@/views/model/edge-tts/components/AudioCreate.vue";
import BatchSetting from "@/views/model/edge-tts/components/BatchSetting.vue";
import {ref} from "vue";

const configListRef = ref<{configRefresh: Function} | null>(null)

const batchSettingVisible = ref<boolean>(false)

</script>

<template>
  <div>
    <n-tabs type="card" size="small" animated>
      <template #suffix>
        <a-space>
          <a-button
              type="outline"
              style="margin-right: 20px"
              size="small"
              @click="() => (batchSettingVisible = true)"
          >
            批量设置
          </a-button>
        </a-space>
      </template>
      <n-tab-pane name="1" tab="配置参数列表">
        <config-param-list ref="configListRef"/>
      </n-tab-pane>
      <n-tab-pane name="2" tab="音频生成">
        <audio-create/>
      </n-tab-pane>
    </n-tabs>
    <batch-setting
        v-model:visible="batchSettingVisible"
        @change="configListRef?.configRefresh()"
    />
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
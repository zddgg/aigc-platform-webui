<script setup lang="ts">
import {onMounted, ref} from "vue";
import {AudioServerConfig, queryAudioServerConfig, updateAudioServerConfig} from "@/api/config.ts";
import {Message} from "@arco-design/web-vue";

const audioServers = ref<AudioServerConfig[]>([])
const handleQueryAudioServerConfig = async () => {
  const {data} = await queryAudioServerConfig();
  audioServers.value = data;
}

const backupText = ref<string>('');
const editStart = (value: string) => {
  backupText.value = value;
}
const editEnd = async (config: AudioServerConfig) => {
  if (config.serverUrl === backupText.value) {
    return;
  }
  const {msg} = await updateAudioServerConfig(config);
  Message.success(msg);
}

onMounted(() => {
  handleQueryAudioServerConfig();
})
</script>

<template>
  <div>
    <a-space direction="vertical" size="large" style="width: 100%;">
      <a-card title="音频生成服务" :bordered="false">
        <a-grid :row-gap="24" :col-gap="24" :cols="1">
          <a-grid-item
              v-for="(item, index) in audioServers"
              :key="index"
          >
            <a-card style="border: #a9a9a9 1px solid">
              <a-descriptions :bordered="true" :column="1" :title="item.name">
                <a-descriptions-item label="serverUrl">
                  <a-typography-text
                      v-model:edit-text="item.serverUrl"
                      editable
                      @edit-start="editStart(item.serverUrl)"
                      @edit-end="editEnd(item)"
                  >

                    {{ item.serverUrl }}
                  </a-typography-text>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-grid-item>
        </a-grid>
      </a-card>
    </a-space>
  </div>
</template>

<style scoped>

</style>
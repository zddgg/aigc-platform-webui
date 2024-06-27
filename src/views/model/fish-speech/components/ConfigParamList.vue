<script setup lang="ts">
import {onMounted, ref} from "vue";
import {configs as queryConfigs, deleteConfig, FishSpeechConfig} from "@/api/fish-speech.ts";
import {Message} from "@arco-design/web-vue";

const configs = ref<FishSpeechConfig[]>([])

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  configs.value = data;
}

const handleDeleteConfig = async (config: FishSpeechConfig) => {
  const {msg} = await deleteConfig(config)
  Message.success(msg)
  await handleQueryConfigs();
}

const emits = defineEmits(['configEdit'])
const configEdit = (id: number | undefined) => {
  emits('configEdit', id)
}

onMounted(() => {
  handleQueryConfigs();
})
</script>

<template>
  <div>
    <a-empty v-if="!configs || !configs.length"/>
    <a-space v-else wrap size="medium">
      <a-card
          v-for="(item, index) in configs"
          :key="index"
          hoverable
          style="width: 360px"
      >
        <a-descriptions
            :title="item.configName"
            :column="2"
            bordered
            layout="inline-vertical"
        >
          <a-descriptions-item label="top_P">
            {{ item.topP }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ item.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="repetitionPenalty">
            <div style="display: flex; justify-content: space-between">
              <div>
                <span>
                  {{ item.repetitionPenalty }}
                </span>
              </div>
              <div>
                <a-space>
                  <a-button
                      type="outline"
                      size="mini"
                      @click="configEdit(item.id)"
                  >
                    <icon-edit/>
                  </a-button>
                  <a-popconfirm
                      type="error"
                      content="确认删除？"
                      @ok="handleDeleteConfig(item)"
                  >
                    <a-button
                        type="outline"
                        status="danger"
                        size="mini"
                    >
                      <icon-delete/>
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </div>
            </div>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-space>
  </div>
</template>

<style scoped>
</style>
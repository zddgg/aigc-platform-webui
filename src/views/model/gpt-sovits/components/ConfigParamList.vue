<script setup lang="ts">
import {onMounted, ref} from "vue";
import {configs as queryConfigs, deleteConfig, GptSovitsConfig} from "@/api/gpt-sovits.ts";
import {Message} from "@arco-design/web-vue";

const configs = ref<GptSovitsConfig[]>([])

const handleQueryConfigs = async () => {
  const {data} = await queryConfigs()
  configs.value = data;
}

const handleDeleteConfig = async (config: GptSovitsConfig) => {
  const {msg} = await deleteConfig(config)
  Message.success(msg)
  await handleQueryConfigs();
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
          <a-descriptions-item label="top_K">
            {{ item.topK }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ item.topP }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ item.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="repetitionPenalty">
            {{ item.repetitionPenalty }}
          </a-descriptions-item>
          <a-descriptions-item label="batchSize">
            {{ item.batchSize }}
          </a-descriptions-item>
          <a-descriptions-item label="parallelInfer">
            {{ item.parallelInfer }}
          </a-descriptions-item>
          <a-descriptions-item label="splitBucket">
            {{ item.splitBucket }}
          </a-descriptions-item>
          <a-descriptions-item label="seed">
            {{ item.seed }}
          </a-descriptions-item>
          <a-descriptions-item label="textSplitMethod">
            {{ item.textSplitMethod }}
          </a-descriptions-item>
          <a-descriptions-item label="fragmentInterval">
            {{ item.fragmentInterval }}
          </a-descriptions-item>
          <a-descriptions-item label="speedFactor">
            <div style="display: flex; justify-content: space-between">
              <div>
                <span>
                  {{ item.speedFactor }}
                </span>
              </div>
              <div>
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
                    删除
                  </a-button>
                </a-popconfirm>
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
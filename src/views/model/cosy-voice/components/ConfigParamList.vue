<script setup lang="ts">
import {configs as queryChatTtsConfigs, deleteConfig} from "@/api/chat-tts.ts"
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {ChatTtsConfig} from "@/api/chat-tts.ts";

const chatTtsConfigs = ref<ChatTtsConfig[]>([])

const handleQueryChatTtsConfig = async () => {
  const {data} = await queryChatTtsConfigs()
  chatTtsConfigs.value = data;
}

const handleDeleteChatTtsConfig = async (config: ChatTtsConfig) => {
  const {msg} = await deleteConfig(config)
  Message.success(msg)
  await handleQueryChatTtsConfig();
}

const emits = defineEmits(['configEdit'])
const configEdit = (id: number | undefined) => {
  emits('configEdit', id)
}

onMounted(() => {
  handleQueryChatTtsConfig();
})
</script>

<template>
  <div>
    <a-empty v-if="!chatTtsConfigs || !chatTtsConfigs.length"/>
    <a-space v-else wrap size="medium">
      <a-card
          v-for="(item, index) in chatTtsConfigs"
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
          <a-descriptions-item label="audio_seed">
            {{ item.audioSeedInput }}
          </a-descriptions-item>
          <a-descriptions-item label="text_seed">
            {{ item.textSeedInput }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ item.topP }}
          </a-descriptions-item>
          <a-descriptions-item label="top_K">
            {{ item.topK }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ item.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_flag">
            {{ item.refineTextFlag }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_params">
            <div style="display: flex; justify-content: space-between">
              <div>
                <span>
                  {{ item.refineTextParams }}
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
                      @ok="handleDeleteChatTtsConfig(item)"
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
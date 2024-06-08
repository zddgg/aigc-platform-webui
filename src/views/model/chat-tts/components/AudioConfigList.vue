<script setup lang="ts">
import {deleteChatTtsConfig, queryChatTtsConfig} from "@/api/config.ts";
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {ChatTtsConfig} from "@/api/chat-tts.ts";

const chatTtsConfigs = ref<ChatTtsConfig[]>([])

const handleQueryChatTtsConfig = async () => {
  const {data} = await queryChatTtsConfig()
  chatTtsConfigs.value = data;
}

const handleDeleteChatTtsConfig = async (config: ChatTtsConfig) => {
  const {msg} = await deleteChatTtsConfig(config)
  Message.success(msg)
  await handleQueryChatTtsConfig();
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
            {{ item.audio_seed_input }}
          </a-descriptions-item>
          <a-descriptions-item label="text_seed">
            {{ item.text_seed_input }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ item.top_P }}
          </a-descriptions-item>
          <a-descriptions-item label="top_K">
            {{ item.top_K }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ item.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_flag">
            {{ item.refine_text_flag }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_params">
            <div style="display: flex; justify-content: space-between">
              <div>
                <span>
                  {{ item.params_refine_text }}
                </span>
              </div>
              <div>
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
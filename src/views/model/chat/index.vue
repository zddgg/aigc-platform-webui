<script setup lang="ts">
import {onMounted, ref} from "vue";
import ChatParamDetail from "@/views/model/chat/components/ChatParamDetail.vue";
import {Message} from "@arco-design/web-vue";
import {ChatModelParam, deleteChatConfig, queryChatConfig} from "@/api/config.ts";

const visible = ref(false);
const chatServices = ref<ChatModelParam[]>([]);
const currentModelParam = ref<ChatModelParam>({} as ChatModelParam);

const handleQueryChatConfig = async () => {
  const {data} = await queryChatConfig();
  chatServices.value = data.services;
}

const handleDeleteChatConfig = async (item: ChatModelParam) => {
  const {msg} = await deleteChatConfig(item);
  await handleQueryChatConfig();
  Message.success(msg);
}


const addConfig = () => {
  currentModelParam.value = {} as ChatModelParam;
  visible.value = true
}


const editConfig = (item: ChatModelParam) => {
  currentModelParam.value = item;
  visible.value = true
}

onMounted(() => {
  handleQueryChatConfig();
})

</script>

<template>
  <div>
    <div style="padding: 20px 0">
      <a-button type="primary" @click="addConfig">添加文本大模型</a-button>
    </div>
    <a-grid :cols="2" :col-gap="20" :row-gap="20">
      <a-grid-item v-for="(item, index) in chatServices" :key="index">
        <a-card
            hoverable
            style="border-radius: 8px">
          <a-descriptions bordered :column="1">
            <template #title>
              <div style="display: flex; align-items: center">
                <a-typography-text>
                  {{ item.name }}
                </a-typography-text>
                <a-tag
                    size="small"
                    color="green"
                    style="margin-left: 20px"
                >
                  <template #icon>
                    <icon-check-circle-fill/>
                  </template>
                  <span>已激活</span>
                </a-tag>
              </div>
            </template>
            <a-descriptions-item label="interfaceType">
              <a-typography-text>
                {{ item.interfaceType }}
              </a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="host">
              <a-typography-text copyable>
                {{ item.host }}
              </a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="apiKey">
              <a-typography-text copyable :copy-text="item.apiKey">
                {{ '******' }}
              </a-typography-text>
            </a-descriptions-item>
            <a-descriptions-item label="model">
              <a-typography-text copyable>
                {{ item.model }}
              </a-typography-text>
            </a-descriptions-item>
          </a-descriptions>
          <div style="margin-top: 20px; text-align: right">
            <a-space size="large">
              <a-button type="primary" @click="editConfig(item)">修改</a-button>
              <a-popconfirm type="error"
                            content="确认删除？"
                            position="tr"
                            @ok="handleDeleteChatConfig(item)">
                <a-button type="primary" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>
    <chat-param-detail
        v-model:visible="visible"
        :chat-model-param="currentModelParam"
        @success="() => handleQueryChatConfig()"
    />
  </div>
</template>

<style scoped>

</style>
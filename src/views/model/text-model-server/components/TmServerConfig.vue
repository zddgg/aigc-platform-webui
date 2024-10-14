<script setup lang="ts">
import {onMounted, ref} from "vue";
import ChatParamDetail from "@/views/model/text-model-server/components/ChatParamDetail.vue";
import {Message} from "@arco-design/web-vue";
import {activeModelChatConfig, deleteModelChatConfig, queryTmServers, TmServer} from "@/api/tm-server.ts";

const visible = ref(false);
const chatConfigs = ref<TmServer[]>([]);
const currentModelConfig = ref<TmServer>({} as TmServer);

const handleQueryChatConfig = async () => {
  const {data} = await queryTmServers();
  chatConfigs.value = data;
}

const handleDeleteChatConfig = async (item: TmServer) => {
  const {msg} = await deleteModelChatConfig(item);
  await handleQueryChatConfig();
  Message.success(msg);
}


const addConfig = () => {
  currentModelConfig.value = {} as TmServer;
  visible.value = true
}


const editConfig = (item: TmServer) => {
  currentModelConfig.value = item;
  visible.value = true
}


const activeConfig = async (item: TmServer) => {
  const {msg} = await activeModelChatConfig(item);
  Message.success(msg);
  await handleQueryChatConfig();
}

onMounted(() => {
  handleQueryChatConfig();
})

</script>

<template>
  <div style="margin-top: 10px">
    <div style="padding-bottom: 20px">
      <a-button type="primary" @click="addConfig">添加文本大模型</a-button>
    </div>
    <a-grid :cols="{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 3 }" :col-gap="20" :row-gap="20">
      <a-grid-item v-for="(item, index) in chatConfigs" :key="index">
        <a-card
            hoverable
            style="border-radius: 8px"
        >
          <a-descriptions bordered :column="1">
            <template #title>
              <div style="display: flex; align-items: center">
                <a-typography-text>
                  {{ item.name }}
                </a-typography-text>
                <a-tag
                    v-if="item.active"
                    size="small"
                    color="green"
                    style="margin-left: 20px"
                >
                  <template #icon>
                    <icon-check-circle-fill/>
                  </template>
                  <span>默认</span>
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
              <a-button v-if="!item.active" type="outline" status="success" @click="activeConfig(item)">设置默认</a-button>
              <a-button type="primary" @click="editConfig(item)">修改</a-button>
              <a-popconfirm
                  type="error"
                  content="确认删除？"
                  position="tr"
                  @ok="handleDeleteChatConfig(item)"
              >
                <a-button type="primary" status="danger">删除</a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </a-card>
      </a-grid-item>
    </a-grid>
    <chat-param-detail
        v-model:visible="visible"
        :chat-model-config="currentModelConfig"
        @success="() => handleQueryChatConfig()"
    />
  </div>
</template>

<style scoped>

</style>
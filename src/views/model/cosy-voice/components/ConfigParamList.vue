<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message, TableColumnData} from "@arco-design/web-vue";
import {AmModelConfig, deleteConfig, getByModelType as queryModelConfigs} from "@/api/am-model-config.ts";
import {COSY_VOICE} from "@/types/model-types.ts";

const modelConfigs = ref<AmModelConfig[]>([])

const columns: TableColumnData[] = [
  {title: '配置名称', slotName: 'configName'},
  {title: '语音生成模式', slotName: 'mode'},
  {title: '预置音色', slotName: 'role'},
  {title: 'seed', slotName: 'seed'},
  {title: 'instruct', slotName: 'instruct'},
  {title: '操作', slotName: 'operations'},
]

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: COSY_VOICE})
  modelConfigs.value = data;
}

const handleDeleteConfig = async (config: AmModelConfig) => {
  const {msg} = await deleteConfig(config)
  Message.success(msg)
  await handleQueryModelConfigs();
}

const emits = defineEmits(['configEdit'])
const configEdit = (id: number | undefined) => {
  emits('configEdit', id)
}

onMounted(() => {
  handleQueryModelConfigs();
})
</script>

<template>
  <div>
    <a-empty v-if="!modelConfigs || !modelConfigs.length"/>
    <a-table
        v-else
        :data="modelConfigs"
        :columns="columns"
        :bordered="{cell:true}"
        :pagination="false"
    >
      <template #configName="{ record }">
        {{ record.mcName }}
      </template>
      <template #mode="{ record }">
        {{
          JSON.parse(record.mcParamsJson).mode === 'preset'
              ? '预置语音生成'
              : JSON.parse(record.mcParamsJson).mode === 'custom'
                  ? '定制语音生成'
                  : JSON.parse(record.mcParamsJson).mode === 'advanced'
                      ? '高级语音生成'
                      : ''
        }}
      </template>
      <template #role="{ record }">
        {{ JSON.parse(record.mcParamsJson).role }}
      </template>
      <template #seed="{ record }">
        {{ JSON.parse(record.mcParamsJson).seed }}
      </template>
      <template #instruct="{ record }">
        <a-typography-text ellipsis>
          {{ JSON.parse(record.mcParamsJson).instruct }}
        </a-typography-text>
      </template>
      <template #operations="{ record }">
        <a-space>
          <a-button
              type="outline"
              size="mini"
              @click="configEdit(record.id)"
          >
            <icon-edit/>
          </a-button>
          <a-popconfirm
              type="error"
              content="确认删除？"
              position="left"
              @ok="handleDeleteConfig(record)"
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
      </template>
    </a-table>
  </div>
</template>

<style scoped>
</style>
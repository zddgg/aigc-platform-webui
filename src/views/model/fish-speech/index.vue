<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {queryModels} from "@/api/fish-speech.ts";
import {Model} from "@/api/model.ts";

const gsvModels = ref<Model[]>([])
const groupOptions = ref<string[]>([])

const computedGsvModels = computed(() => {
  return Object.entries(gsvModels.value.reduce((result: any, item: Model) => {
    if (!result[item.group]) {
      result[item.group] = [];
    }
    result[item.group].push(item);
    return result;
  }, {})).map(([group, items]) => ({group: group, list: items} as { group: string, list: Model[] }));
})

const handleQueryConfig = async () => {
  const {data} = await queryModels();
  gsvModels.value = data;
  groupOptions.value = [...new Set(data.map((item) => item.group))]
}

onMounted(() => {
  handleQueryConfig();
})
</script>

<template>
  <div>
    <div>
      <a-tabs type="rounded" :default-active-key="groupOptions[0]" size="large">
        <a-tab-pane v-for="(item) in groupOptions" :key="item" :title="item">
          <a-space size="medium" wrap>
            <a-card
                v-for="(item1, index1) in computedGsvModels
                .filter(value => value.group === item)
                .flatMap(value => value.list)"
                :key="index1"
                hoverable
            >
              <a-descriptions
                  size="large"
                  :title="item1.name"
                  :column="1"
                  bordered
                  style="min-width: 350px"
              >
                <a-descriptions-item label="ckpt">
                  {{ item1.gptWeights }}
                </a-descriptions-item>
                <a-descriptions-item label="pth">
                  {{ item1.sovitsWeights }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-space>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-tabs-tab-active) {
  background-color: #ffffff;
}

.icon-hover {
  padding: 2px;
  border-radius: 2px;
  margin-left: 10px;
}

.icon-hover:hover {
  background-color: #e5e5e5;
}
</style>
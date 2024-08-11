<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Message} from "@arco-design/web-vue";
import {
  AmModelConfig,
  getByModelType as queryModelConfigs,
  deleteConfig,
  playOrCreateAudio
} from "@/api/am-model-config.ts";
import {CHAT_TTS} from "@/types/model-types.ts";
import useLoading from "@/hooks/loading.ts";

const {loading, setLoading} = useLoading();

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const modelConfigs = ref<AmModelConfig[]>([])
const activeAudioKey = ref<string>('')
const createAudioKey = ref('')

const handleQueryModelConfigs = async () => {
  const {data} = await queryModelConfigs({modelType: CHAT_TTS})
  modelConfigs.value = data;
}

const handleDeleteChatTtsConfig = async (config: AmModelConfig) => {
  const {msg} = await deleteConfig(config)
  Message.success(msg)
  await handleQueryModelConfigs();
}

const emits = defineEmits(['configEdit'])
const configEdit = (id: number | undefined) => {
  emits('configEdit', id)
}

const playAudio = async (modelConfig: AmModelConfig) => {
  try {
    createAudioKey.value = modelConfig.mcName;
    setLoading(true);
    const response = await playOrCreateAudio({mcId: modelConfig.mcId});
    const url = URL.createObjectURL(response.data);

    activeAudioKey.value = modelConfig.mcName;

    if (audioElement.value) {
      // 设置音频源
      audioElement.value.src = url;

      // 播放音频
      audioElement.value.play();
    }
  } catch (e) {
    activeAudioKey.value = '';
  } finally {
    createAudioKey.value = '';
    setLoading(false);
  }
}

const stopAudio = () => {
  if (audioElement.value) {
    // 停止音频播放
    audioElement.value.pause();
    audioElement.value.currentTime = 0; // 将播放进度设置为音频开头
  }
  activeAudioKey.value = '';
};

const handleAudioEnded = () => {
  activeAudioKey.value = '';
};

onMounted(() => {
  handleQueryModelConfigs();
})
</script>

<template>
  <div>
    <a-empty v-if="!modelConfigs || !modelConfigs.length"/>
    <a-space v-else wrap size="medium">
      <a-card
          v-for="(item, index) in modelConfigs"
          :key="index"
          hoverable
          style="width: 360px"
      >
        <a-descriptions
            :title="item.mcName"
            :column="2"
            bordered
            layout="inline-vertical"
        >
          <a-descriptions-item label="audio_seed">
            {{ JSON.parse(item.mcParamsJson).audio_seed }}
          </a-descriptions-item>
          <a-descriptions-item label="text_seed">
            {{ JSON.parse(item.mcParamsJson).text_seed }}
          </a-descriptions-item>
          <a-descriptions-item label="top_P">
            {{ JSON.parse(item.mcParamsJson).params_infer_code?.top_P }}
          </a-descriptions-item>
          <a-descriptions-item label="top_K">
            {{ JSON.parse(item.mcParamsJson).params_infer_code?.top_K }}
          </a-descriptions-item>
          <a-descriptions-item label="temperature">
            {{ JSON.parse(item.mcParamsJson).params_infer_code?.temperature }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_flag">
            {{ !JSON.parse(item.mcParamsJson).skip_refine_text }}
          </a-descriptions-item>
          <a-descriptions-item label="refine_params">
            {{ JSON.parse(item.mcParamsJson).params_refine_text?.prompt }}
          </a-descriptions-item>
        </a-descriptions>
        <div style="text-align: right; margin-top: 10px">
          <a-space>
            <div>
              <a-button
                  v-if="activeAudioKey === item.mcName"
                  type="outline"
                  status="danger"
                  size="mini"
                  @click="stopAudio"
              >
                <icon-mute-fill/>
              </a-button>
              <a-button
                  v-else
                  type="outline"
                  size="mini"
                  :disabled="createAudioKey === item.mcName && loading"
                  @click="playAudio(item)"
              >
                <icon-refresh
                    v-if="createAudioKey === item.mcName && loading"
                    :spin="createAudioKey === item.mcName && loading"
                />
                <icon-play-arrow v-else/>
              </a-button>
            </div>
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
      </a-card>
    </a-space>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>

</style>
<script setup lang="ts">
import {onMounted, PropType, ref, watch} from "vue";
import {FormInstance, Message} from "@arco-design/web-vue";
import {updateRefAudio, RefAudio} from "@/api/ref-audio.ts";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  audio: {
    type: Object as PropType<RefAudio>
  }
})

const emits = defineEmits(['update:visible', 'success']);

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const showModal = ref(false);
const formRef = ref<FormInstance>();
const form = ref<RefAudio>({} as RefAudio);
const showMoodTag = ref('');

const activeAudioKey = ref<string>('')

const playAudio = (key: string, url: string) => {
  activeAudioKey.value = key;
  if (audioElement.value) {
    // 设置音频源
    audioElement.value.src = url;
    // 播放音频
    audioElement.value.play();
  }
};

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

const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const res = await formRef.value?.validate();
  if (!res) {
    const {msg} = await updateRefAudio(form.value)
    done(true);
    Message.success(msg);
    emits('success')
  }
  done(false)
};

const close = () => {
  emits('update:visible', false);
  stopAudio();
}

const langDicts = ref<LangDict[]>([])

const handleLangDicts = async () => {
  const {data} = await queryLangDicts()
  langDicts.value = data;
}

onMounted(() => {
  handleLangDicts()
})

watch(
    () => props.visible,
    () => {
      if (props.visible) {
        form.value = {...props.audio} as RefAudio
        showMoodTag.value = ''
      }
      showModal.value = props.visible
    },
    {immediate: true}
);
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        :title="form.name"
        :width="700"
        :unmount-on-close="true"
        @before-ok="handleBeforeOk"
        @close="close"
        @cancel="close"
    >
      <a-form
          ref="formRef"
          :model="form"
          :label-col-props="{ span: 6 }"
          :wrapper-col-props="{ span: 18 }"
      >
        <div style="display: flex">
          <div style="width: 20%; text-align: center">
            <a-avatar
                v-if="form.avatarUrl"
                :image-url="form.avatarUrl"
                :size="80"
            />
            <a-avatar v-else :size="80">
              {{ form.group === 'edge-tts' ? voiceNameFormat(form.name) : form.name }}
            </a-avatar>
          </div>
          <div style="width: 80%">
            <a-row>
              <a-col :span="12">
                <a-form-item label="性别">
                  <a-select v-model="form.gender">
                    <a-option>男</a-option>
                    <a-option>女</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="年龄">
                  <a-select v-model="form.ageGroup">
                    <a-option>老年</a-option>
                    <a-option>中年</a-option>
                    <a-option>青年</a-option>
                    <a-option>少年</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="语言">
                  <a-select
                      v-model="form.language"
                      :options="langDicts"
                      :field-names="{value: 'enName', label: 'zhName'}"
                  >
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </div>
        <a-form-item label="标签"
                     :label-col-props="{ span: 2 }"
                     :wrapper-col-props="{ span: 22 }"
        >
          <a-select v-model="form.tags" multiple allow-create></a-select>
        </a-form-item>
      </a-form>
      <a-tabs :default-active-key="form.moods[0].name">
        <a-tab-pane v-for="(item, index) in form.moods" :key="item.name">
          <template #title>
            <a-avatar v-if="item.avatarUrl || form.avatarUrl" :image-url="item.avatarUrl ?? form.avatarUrl"/>
            <span style="margin-left: 10px">{{ item.name }}</span>
          </template>
          <n-scrollbar style="height: 350px">
            <div style="margin-right: 10px">
              <a-space direction="vertical" style="width: 100%">
                <a-card
                    v-for="(item1, index1) in item.moodAudios"
                    :key="index1"
                    :body-style="{padding: '10px'}"
                    hoverable
                >
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <a-typography-text>
                      {{ item1.text }}
                    </a-typography-text>
                    <div style="">
                      <a-space>
                        <a-button
                            v-if="activeAudioKey === `${item.name}-${item1.name}`"
                            type="outline"
                            status="danger"
                            size="mini"
                            @click="stopAudio"
                        >
                          <icon-mute/>
                        </a-button>
                        <a-button
                            v-else
                            type="outline"
                            size="mini"
                            @click="playAudio(`${item.name}-${item1.name}`, item1.audioUrl)"
                        >
                          <icon-play-arrow/>
                        </a-button>
                        <a-button
                            type="primary"
                            size="mini"
                            @click="() => (showMoodTag = `${index}-${index1}`)"
                        >
                          标签
                        </a-button>
                      </a-space>
                    </div>
                  </div>
                  <a-form-item v-if="showMoodTag === `${index}-${index1}`" label="标签">
                    <a-select v-model="item1.tags" multiple allow-create size="mini"/>
                    <a-tag style="margin-left: 10px"
                           @click="() => showMoodTag = ''"
                    >
                      <icon-up/>
                    </a-tag>
                  </a-form-item>
                </a-card>
              </a-space>
            </div>
          </n-scrollbar>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
    <audio ref="audioElement" @ended="handleAudioEnded"></audio>
  </div>
</template>

<style scoped>

</style>
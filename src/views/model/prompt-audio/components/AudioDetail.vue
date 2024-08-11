<script setup lang="ts">
import {onMounted, PropType, ref, watch} from "vue";
import {FormInstance, Message} from "@arco-design/web-vue";
import {voiceNameFormat} from "@/utils/model-util.ts";
import {LangDict, queryLangDicts} from "@/api/dict.ts";
import {PromptAudio, updatePromptAudio} from "@/api/prompt-audio.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  promptAudio: {
    type: Object as PropType<PromptAudio>
  }
})

const emits = defineEmits(['update:visible', 'success']);

const audioElement = ref<HTMLAudioElement | null>(null); // ref 对象引用到 audio 元素

const showModal = ref(false);
const formRef = ref<FormInstance>();
const form = ref<PromptAudio>({} as PromptAudio);
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
    const {msg} = await updatePromptAudio(form.value)
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
        form.value = {...props.promptAudio} as PromptAudio
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
        :title="form.paRole"
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
                v-if="form.paRoleAvatar"
                :image-url="form.paRoleAvatar"
                :size="80"
            />
            <a-avatar v-else :size="80">
              {{ form.paGroup === 'edge-tts' ? voiceNameFormat(form.paRole) : form.paRole }}
            </a-avatar>
          </div>
          <div style="width: 80%">
            <a-row>
              <a-col :span="12">
                <a-form-item label="性别">
                  <a-select v-model="form.paRoleGender">
                    <a-option>男</a-option>
                    <a-option>女</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="年龄">
                  <a-select v-model="form.paRoleAge">
                    <a-option>少年</a-option>
                    <a-option>青年</a-option>
                    <a-option>中年</a-option>
                    <a-option>老年</a-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="语言">
                  <a-select
                      v-model="form.paRoleLang"
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
          <a-select v-model="form.paRoleTags" multiple allow-create></a-select>
        </a-form-item>
      </a-form>
      <a-tabs :default-active-key="form.paMoods[0].paMood">
        <a-tab-pane v-for="(item, index) in form.paMoods" :key="item.paMood">
          <template #title>
            <a-avatar v-if="item.paMoodAvatar || form.paRoleAvatar" :image-url="item.paMoodAvatar ?? form.paRoleAvatar"/>
            <span style="margin-left: 10px">{{ item.paMood }}</span>
          </template>
          <n-scrollbar style="height: 350px">
            <div style="margin-right: 10px">
              <a-space direction="vertical" style="width: 100%">
                <a-card
                    v-for="(item1, index1) in item.paAudios"
                    :key="index1"
                    :body-style="{padding: '10px'}"
                    hoverable
                >
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <a-typography-text>
                      {{ item1.paAudioText }}
                    </a-typography-text>
                    <div style="">
                      <a-space>
                        <a-button
                            v-if="activeAudioKey === `${item.paMood}-${item1.paAudio}`"
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
                            @click="playAudio(`${item.paMood}-${item1.paAudio}`, item1.audioUrl)"
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
                    <a-select v-model="item1.paAudioTags" multiple allow-create size="mini"/>
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
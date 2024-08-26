<script setup lang="ts">
import {ref, watch} from "vue";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js'
import {throttle} from "lodash";
import {getChapterAudio, getChapterSubtitle, Subtitle} from "@/api/text-chapter.ts";
import {useRoute} from "vue-router";
import {openFolder} from "@/api/file.ts";

const route = useRoute();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});
const emits = defineEmits(['update:visible']);

const showModal = ref(false)

const wavesurfer = ref<WaveSurfer | null>(null)
const isPlaying = ref(false)
const showVolumeSlider = ref(false)
const showSpeedSlider = ref(false)

const audioVolume = ref<number>(1)
const audioSpeed = ref<number>(1)

const subtitles = ref<Subtitle[]>([]);

const currentSubtitleIndex = ref(-1)
const isMouse = ref<boolean>(false)

const initWaveSurfer = async () => {
  if (wavesurfer.value) {
    wavesurfer.value.destroy();
  }
  isPlaying.value = false;

  const response = await getChapterAudio({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })

  if (response.data) {
    const audioUrl = URL.createObjectURL(response.data);

    wavesurfer.value = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#9CA3AF',
      progressColor: '#165DFF',
      url: audioUrl,
      height: 60,
      barWidth: 2,
      barGap: 2,
      barRadius: 50,
      plugins: [
        TimelinePlugin.create(),
        HoverPlugin.create(),
      ],
    })

    wavesurfer.value.on('play', () => {
      isPlaying.value = true
    })

    wavesurfer.value.on('pause', () => {
      isPlaying.value = false
    })

    wavesurfer.value.on('audioprocess', (currentTime: number) => {
      updateSubtitles(currentTime)
    })
  }
}

const querySubtitles = async () => {
  const {data} = await getChapterSubtitle({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
  })
  subtitles.value = data;
}

const play = () => {
  wavesurfer.value?.play()
}

const pause = () => {
  wavesurfer.value?.pause()
}

const forward = () => {
  if (wavesurfer.value) {
    const currentTime = wavesurfer.value.getCurrentTime()
    wavesurfer.value.seekTo((currentTime + 5) / wavesurfer.value.getDuration())
  }
}

const backward = () => {
  if (wavesurfer.value) {
    const currentTime = wavesurfer.value.getCurrentTime()
    wavesurfer.value.seekTo((currentTime - 5) / wavesurfer.value.getDuration())
  }
}

const onVolumeChange = (volume: number) => {
  audioVolume.value = volume
  wavesurfer.value?.setVolume(volume)
}

const onSpeedChange = (speed: number) => {
  audioSpeed.value = speed
  wavesurfer.value?.setPlaybackRate(speed)
}

const subtitleContainer = ref<HTMLDivElement | null>(null)

const updateSubtitles = throttle((currentTime: number) => {
  const index = subtitles.value.findIndex(line => line.startTime < currentTime && line.endTime > currentTime)

  if (index !== -1) {
    currentSubtitleIndex.value = index

    const activeElement = subtitleContainer.value?.children[currentSubtitleIndex.value] as HTMLElement
    if (!isMouse.value && activeElement) {
      activeElement.scrollIntoView({behavior: 'smooth', block: 'center'})
    }
  }
}, 300);

const mouseOverLayout = () => {
  isMouse.value = true
}

const mouseLeaveLayout = () => {
  setTimeout(() => {
    isMouse.value = false
  }, 2000)
}

const setAudioTime = (subtitle: Subtitle) => {
  if (wavesurfer.value) {
    const duration = wavesurfer.value.getDuration();
    const newTime = subtitle.startTime / duration;
    wavesurfer.value.seekTo(newTime);
  }
}

const handleOpenFolder = async () => {
  await openFolder({
    projectId: route.query.projectId as string,
    chapterId: route.query.chapterId as string,
    op: '',
  })
}

const close = () => {
  emits('update:visible', false);
}

watch(() => props.visible,
    () => {
      showModal.value = props.visible
      if (props.visible) {
        initWaveSurfer()
        querySubtitles()
        currentSubtitleIndex.value = -1
      } else {
        wavesurfer.value?.destroy()
      }
    },
    {immediate: true}
)
</script>

<template>
  <div>
    <a-modal
        v-model:visible="showModal"
        title="音频预览"
        :width="960"
        :ok-text="'关闭'"
        :footer="false"
        draggable
        @close="close"
        @cancel="close"
    >
      <div>
        <n-layout
            style="height: 300px"
            :native-scrollbar="false"
            @mouseover="mouseOverLayout"
            @mouseleave="mouseLeaveLayout"
        >
          <div ref="subtitleContainer">
            <div
                v-for="(item, index) in subtitles"
                :key="index"
                :class="{ 'subtitle-text-active': currentSubtitleIndex === index }"
                class="subtitle-text"
                @click="setAudioTime(item)"
            >
              {{ item.text }}
            </div>
          </div>
        </n-layout>
        <a-card style="border-radius: 5px; margin-top: 20px">
          <div id="waveform"></div>
          <a-row style="margin-top: 15px">
            <a-col :span="8">
              <a-space>
                <a-button
                    size="mini"
                    @click="() => {
                  showVolumeSlider = !showVolumeSlider;
                  showSpeedSlider = false;
                }"
                >
                  <icon-mute v-if="audioVolume === 0"/>
                  <icon-sound v-else/>
                </a-button>
                <n-slider v-if="showVolumeSlider" v-model:value="audioVolume" :min="0" :max="1" :step="0.01"
                          style="width: 80px"
                          @update-value="onVolumeChange"
                />
                <a-button
                    v-if="!showVolumeSlider"
                    size="mini"
                    @click="showSpeedSlider = !showSpeedSlider"
                >
                  <icon-forward/>
                </a-button>
                <n-slider v-if="showSpeedSlider" v-model:value="audioSpeed" :min="0.1" :max="2" :step="0.1"
                          style="width: 80px"
                          @update-value="onSpeedChange"
                />
              </a-space>
            </a-col>
            <a-col :span="8" style="text-align: center">
              <a-space>
                <a-button size="mini" @click="backward">
                  <icon-backward/>
                </a-button>
                <div>
                  <a-button v-if="isPlaying" type="primary" size="mini" @click="pause">
                    <icon-pause/>
                  </a-button>
                  <a-button v-else size="mini" @click="play">
                    <icon-play-arrow/>
                  </a-button>
                </div>
                <a-button size="mini" @click="forward">
                  <icon-forward/>
                </a-button>
              </a-space>
            </a-col>
            <a-col :span="8" style="text-align: right">
              <a-space>
                <a-button size="mini" @click="handleOpenFolder">
                  <icon-folder/>
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-card>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.subtitle-text {
  margin-bottom: 10px;
  text-align: left;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.subtitle-text:hover {
  font-weight: bold;
  color: #165DFF;
}

.subtitle-text-active {
  font-weight: bold;
  color: #165DFF;
}
</style>
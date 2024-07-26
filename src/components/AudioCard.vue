<script setup lang="ts">
import {onMounted, ref} from 'vue'
import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import Hover from 'wavesurfer.js/dist/plugins/hover.esm.js'

const waveformRef = ref()

let wavesurfer: WaveSurfer | null = null

function initWaveSurfer() {
  wavesurfer = WaveSurfer.create({
    container: waveformRef.value, // 绑定容器
    url: 'http://127.0.0.1:8080/files/model/music/千千阙歌.mp3',
    waveColor: '#9CA3AF',
    progressColor: '#F97316',
    barWidth: 2,
    barRadius: 10,
    barGap: 2,
    height: 30,
    plugins: [
      Hover.create(),
    ],
  })
}

// 播放暂停方法
const playPause = () => {
  wavesurfer?.playPause()
}
onMounted(() => {
  initWaveSurfer()
})
</script>

<template>
  <div>
    <div ref="waveformRef" id="waveform"></div>
  </div>
</template>

<style scoped>
</style>
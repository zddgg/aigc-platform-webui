<script setup lang="ts">
import {refreshCache as refreshPromptAudioCache} from "@/api/prompt-audio.ts";
import {refreshCache as refreshGsvFileCache} from "@/api/am-model-file.ts";
import {syncEdgeTtsConfig} from "@/api/am-model-config.ts";
import {refreshCache as refreshPinyinCache} from "@/api/pinyin.ts";
import {GPT_SOVITS} from "@/types/model-types.ts";

const handleRefreshPromptAudioCache = async () => {
  await refreshPromptAudioCache()
}

const handleRefreshGsvFileCache = async () => {
  await refreshGsvFileCache({modelType: GPT_SOVITS})
}

const handleRefreshEdgeTtsCache = async () => {
  await syncEdgeTtsConfig()
}

const handleRefreshPinyinCache = async () => {
  await refreshPinyinCache()
}
</script>

<template>
  <div>
    <a-space size="large" direction="vertical" style="width: 100%">
      <a-card title="参考音频缓存">
        <a-popconfirm content="刷新缓存?" position="right" @ok="handleRefreshPromptAudioCache">
          <a-button type="outline">刷新缓存</a-button>
        </a-popconfirm>
      </a-card>
      <a-card title="gpt-sovits模型文件">
        <a-popconfirm content="刷新缓存?" position="right" @ok="handleRefreshGsvFileCache">
          <a-button type="outline">刷新缓存</a-button>
        </a-popconfirm>
      </a-card>
      <a-card title="edge-tts音频列表">
        <a-popconfirm content="刷新缓存?" position="right" @ok="handleRefreshEdgeTtsCache">
          <a-button type="outline">刷新缓存</a-button>
        </a-popconfirm>
      </a-card>
      <a-card title="拼音字典缓存">
        <a-popconfirm content="刷新缓存?" position="right" @ok="handleRefreshPinyinCache">
          <a-button type="outline">刷新缓存</a-button>
        </a-popconfirm>
      </a-card>
    </a-space>
  </div>
</template>

<style scoped>

</style>
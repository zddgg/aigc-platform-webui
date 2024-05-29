<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();
const activeIndex = ref('');
</script>

<template>
  <div style="display: flex">
    <div style="width: 90px; height: 100vh; background-color: #ECECEE">
      <div style="width: 100%; display: flex; justify-content: center">
        <a-space direction="vertical" align="center">
          <div style="margin: 16px 0 20px 0">
            <img src="@/assets/logo.png" alt="" style="width: 44px; height: 44px;"/>
          </div>
          <div class="nav-item"
               :class="activeIndex === '文本' ? 'active-item' : ''"
               style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
               @click="() => {
                 activeIndex = '文本';
                 router.push({ name: 'Text' });
               }"
          >
            <div>
              <icon-file size="30"/>
            </div>
            <div style="text-align: center">
              <span>文本</span>
            </div>
          </div>
          <div class="nav-item"
               :class="activeIndex === '音频' ? 'active-item' : ''"
               style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
               @click="() => {activeIndex = '音频'}"
          >
            <div>
              <icon-file-audio size="30"/>
            </div>
            <div style="text-align: center">
              <span>音频</span>
            </div>
          </div>
          <div class="nav-item"
               :class="activeIndex === '图像' ? 'active-item' : ''"
               style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
               @click="() => {activeIndex = '图像'}"
          >
            <div>
              <icon-file-image size="30"/>
            </div>
            <div style="text-align: center">
              <span>图像</span>
            </div>
          </div>
          <div class="nav-item"
               :class="activeIndex === '视频' ? 'active-item' : ''"
               style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
               @click="() => {activeIndex = '视频'}"
          >
            <div>
              <icon-file-video size="30"/>
            </div>
            <div style="text-align: center">
              <span>视频</span>
            </div>
          </div>
          <div class="nav-item"
               :class="activeIndex === '模型' ? 'active-item' : ''"
               style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
               @click="() => {
                 activeIndex = '模型';
                 router.push({ name: 'Model' });
               }"
          >
            <div>
              <icon-robot size="30"/>
            </div>
            <div style="text-align: center">
              <span>模型</span>
            </div>
          </div>
        </a-space>
      </div>
    </div>
    <n-scrollbar style="max-height: 100vh">
      <div>
        <router-view/>
      </div>
    </n-scrollbar>
  </div>
</template>

<style scoped>
.nav-item:hover {
  background-color: #ffffff;
}

.active-item {
  background-color: #C3F6F6 !important;
}
</style>
<template>
  <div
      id="floatBall"
      :style="{ right: `${right}px`, bottom: `${bottom}px` }"
      class="floating-ball"
      @click="handleClick"
      @mousedown="startDrag"
      @touchstart="startTouchDrag"
  >
    <a-popover popup-container="#floatBall">
      <img src="@/assets/float-ball-unbg.png" alt="">
      <template #content>
        <div style="white-space: nowrap;">
          当前版本:
          <span style="margin-left: 4px">
            {{ currentVersion ?? '未知' }}
          </span>
        </div>
        <div style="white-space: nowrap;">
          最新版本:
          <span style="margin-left: 4px">
            {{ latestVersion ?? '未知' }}
          </span>
        </div>
      </template>
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {appLog} from "@/api/dmp-server.js";
import {generateVisitorId} from "@/utils/app-log-utils.js";
import {getAppInfoData} from "@/api/app-info.ts";

const props = defineProps({
  onClick: Function
});

const ballSize = 50; // 图片是 50x50 的大小
const right = ref(50); // 初始距右边距离
const bottom = ref(50); // 初始距底部距离
const isDragging = ref(false);
let startX, startY, offsetX, offsetY, moved;
let animationFrameId = null;

const startDrag = (event) => {
  event.preventDefault();
  isDragging.value = true;
  startX = event.clientX;
  startY = event.clientY;

  // 计算偏移量
  offsetX = (window.innerWidth - right.value) - (startX + ballSize / 2);
  offsetY = (window.innerHeight - bottom.value) - (startY + ballSize / 2);
  moved = false;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopDrag);
  disableTextSelection();
};

const startTouchDrag = (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  isDragging.value = true;
  startX = touch.clientX;
  startY = touch.clientY;

  // 计算偏移量
  offsetX = (window.innerWidth - right.value) - (startX + ballSize / 2);
  offsetY = (window.innerHeight - bottom.value) - (startY + ballSize / 2);
  moved = false;

  window.addEventListener('touchmove', onTouchMove, {passive: false});
  window.addEventListener('touchend', stopTouchDrag);
  disableTextSelection();
};

const onMouseMove = (event) => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(() => {
    updatePosition(event.clientX, event.clientY);
  });
};

const onTouchMove = (event) => {
  event.preventDefault();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  const touch = event.touches[0];
  animationFrameId = requestAnimationFrame(() => {
    updatePosition(touch.clientX, touch.clientY);
  });
};

const updatePosition = (x, y) => {
  moved = true;
  const halfBallSize = ballSize / 2;

  // 确保不超出边界
  right.value = Math.max(0, Math.min(window.innerWidth - x - offsetX - halfBallSize, window.innerWidth - halfBallSize));
  bottom.value = Math.max(0, Math.min(window.innerHeight - y - offsetY - halfBallSize, window.innerHeight - halfBallSize));

  // 处理特殊情况：当浮动球的右边或底边超过屏幕边缘
  if (right.value < 0) {
    right.value = 0;
  }
  if (bottom.value < 0) {
    bottom.value = 0;
  }

  // 确保浮动球在顶部不超出
  if (bottom.value > window.innerHeight - ballSize) {
    bottom.value = window.innerHeight - ballSize;
  }

  // 确保浮动球在左侧不超出
  if (right.value > window.innerWidth - ballSize) {
    right.value = window.innerWidth - ballSize;
  }
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', stopDrag);
  enableTextSelection();

  if (!moved && props.onClick) {
    props.onClick();
  }
};

const stopTouchDrag = () => {
  isDragging.value = false;
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', stopTouchDrag);
  enableTextSelection();

  if (!moved && props.onClick) {
    props.onClick();
  }
};

function disableTextSelection() {
  document.body.style.userSelect = 'none';
}

function enableTextSelection() {
  document.body.style.userSelect = '';
}

const handleClick = () => {
};

const currentVersion = ref<string>('')
const latestVersion = ref<string>('')

const getLocalAppInfo = async () => {
  try {
    const {data} = await getAppInfoData();
    currentVersion.value = data.currentVersion;
  } catch (e) {
    console.error(e);
  }
};

const sendAppAccessLog = () => {
  appAccessLog()
  setInterval(() => {
    appAccessLog()
  }, 2 * 60 * 1000);
};

const appAccessLog = async () => {
  try {
    const {data} = await appLog({
      appId: '29117526',
      visitorId: generateVisitorId(),
      appVersion: currentVersion.value,
    })
    latestVersion.value = data.latestVersion;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  getLocalAppInfo()
  sendAppAccessLog()
})

</script>

<style scoped>
.floating-ball {
  width: 50px; /* 图片宽度 */
  height: 50px; /* 图片高度 */
  background-color: white;
  border-radius: 50%;
  position: absolute;
  cursor: grab;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}

.floating-ball:active {
  cursor: grabbing;
}

.floating-ball:hover {
  background-color: #f8f8f8;
  box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.3);
}
</style>

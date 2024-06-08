<template>
  <div ref="containerRef" style="display: inline">
    <span :class="showMenu && 'highlight'">
      <slot></slot>
    </span>
    <Teleport to="body">
      <div v-if="showMenu" class="context-menu" :style="{ left: x + 'px', top: y + 'px' }"
           @click.right="(e) => e.preventDefault()"
      >
        <div class="menu-list">
          <!-- 添加菜单的点击事件 -->
          <div @click="handleClick(item.value)" class="menu-item" v-for="(item, i) in props.menu" :key="i">
            {{ item.label }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import {PropType, ref} from 'vue';
import useContextMenu from './useContextMenu.ts';

const props = defineProps({
  menu: {
    type: Array as PropType<{ label: string; value: string }[]>,
    default: () => [],
  },
});
const containerRef = ref(null);
const emits = defineEmits(['select']);
const {x, y, showMenu} = useContextMenu(containerRef);

// 菜单的点击事件
function handleClick(item: string) {
  // 选中菜单后关闭菜单
  showMenu.value = false;
  // 并返回选中的菜单
  emits('select', item);
}

</script>


<style scoped>
.context-menu {
  position: absolute;
}

.menu-list {
  padding: 5px;
  background-color: var(--color-bg-popup);
  border-radius: 4px;
  box-shadow: 0 2px 8px #00000026;
}

.menu-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  padding: 0 12px;
  color: var(--color-text-1);
  font-size: 14px;
  line-height: 36px;
  text-align: left;
  background-color: transparent;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #F2F3F5;
}

.highlight {
  background-color: yellow;
  color: #000000;
}
</style>

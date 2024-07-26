<template>
  <div ref="containerRef" style="display: inline">
    <span>
      <slot></slot>
    </span>
    <Teleport to="body">
      <div v-if="showMenu && props.menu && props.menu.length"
           class="context-menu"
           :style="{ left: x + 'px', top: y + 'px' }"
           @click.right="(e) => e.preventDefault()"
      >
        <div class="menu-list">
          <a-space>
            <div
                v-for="(item, index) in props.menu"
                :key="index"
                class="menu-item"
                @click="handleClick(item.value)"
            >
              {{ item.label }}
            </div>
          </a-space>
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
    type: Array as PropType<{ label: string; value: string, disabled: boolean }[]>,
    default: () => [],
  },
});
const containerRef = ref(null);
const emits = defineEmits(['select']);
const {x, y, showMenu} = useContextMenu(containerRef);

// 菜单的点击事件
function handleClick(item: string) {
  console.log(item)
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
  display: flex;
}

.menu-item {
  border: 1px solid var(--color-bg-popup);
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #F2F3F5;
}
</style>

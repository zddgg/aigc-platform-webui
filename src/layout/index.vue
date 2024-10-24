<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";

const route = useRoute();
const router = useRouter();
const currentMenu = ref('')

const menu = [
  {
    menu: 'Text',
    text: '文本',
    route: 'Text',
  },
  {
    menu: 'Audio',
    text: '音频',
    route: 'Audio',
  },
  {
    menu: 'Image',
    text: '图像',
    route: 'Image',
  },
  {
    menu: 'Model',
    text: '模型',
    route: 'Model',
  },
];

onMounted(() => {
  const queryMenu = route.query.menu;
  if (typeof queryMenu === 'string') {
    currentMenu.value = queryMenu;
  } else {
    currentMenu.value = 'Text'; // Default value
  }
});

watch(
    () => route.query.menu,
    (newMenu) => {
      if (typeof newMenu === 'string') {
        currentMenu.value = newMenu;
      }
    }
);
</script>

<template>
  <div style="display: flex">
    <div style="width: 80px; height: 100vh; background-color: #ECECEE; display: flex; flex-direction: column;">
      <div style="width: 100%; display: flex; justify-content: center;">
        <a-space direction="vertical" align="center">
          <div style="margin: 16px 0 20px 0">
            <img src="@/assets/logo.png" alt="" style="width: 40px; height: 40px;"/>
          </div>
          <div
              v-for="(item, index) in menu"
              :key="index"
              class="nav-item"
              :class="currentMenu === item.menu ? 'active-item' : ''"
              style="padding: 10px 18px; border-radius: 8px; cursor: pointer"
              @click="() => {
                 currentMenu = item.menu;
                 router.push({ name: item.route, query: { menu: item.menu } });
              }"
          >
            <div>
              <icon-file size="30"/>
            </div>
            <div style="text-align: center">
              <span>{{ item.text }}</span>
            </div>
          </div>
        </a-space>
      </div>
      <div
          style="margin-top: auto; display: flex; flex-direction: column; align-items: center"
      >
        <div class="nav-item"
             :class="currentMenu === 'Settings' ? 'active-item' : ''"
             style="padding: 10px 18px; border-radius: 8px; cursor: pointer; margin-bottom: 20px"
             @click="() => {
                 currentMenu = '设置';
                 router.push({ name: 'Settings', query: { menu: 'Settings' } });
             }"
        >
          <div>
            <icon-settings size="30"/>
          </div>
          <div style="text-align: center">
            <span>设置</span>
          </div>
        </div>
      </div>
    </div>
    <div style="flex: 1">
      <n-scrollbar style="max-height: 100vh">
        <router-view/>
      </n-scrollbar>
    </div>
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

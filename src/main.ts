import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import eventBusPlugin from './services/eventBusPlugin.ts';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@/axios/default-axios.ts';
import '@/assets/style.css';
import GlobalWebsocketService from "@/services/globalWebsocketService.ts";

GlobalWebsocketService.connect();

const app = createApp(App);
app.use(router)
app.use(eventBusPlugin)
app.use(ArcoVueIcon)
app.mount('#app')

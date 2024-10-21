import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store, {usePinyinStore} from './store';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@/axios/default-axios.ts';
import '@/assets/style.css';
import GlobalWebsocketService from "@/services/globalWebsocketService.ts";
import {sendAppAccessLog} from "@/utils/app-log-utils.ts";

const app = createApp(App);
app.use(router)
app.use(store)
app.use(ArcoVueIcon)
app.mount('#app');

usePinyinStore().fetchPinyinData()
GlobalWebsocketService.connect();
sendAppAccessLog()
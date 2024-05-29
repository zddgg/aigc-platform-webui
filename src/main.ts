import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css';
import naive from 'naive-ui'
import '@/api/interceptor.ts';
import '@/assets/style.css';

const app = createApp(App);
app.use(router)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(naive)
app.mount('#app')

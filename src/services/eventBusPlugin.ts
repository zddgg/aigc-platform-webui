import {App} from "vue";
import mitt from 'mitt';
import {EventBus} from "@/vite-env";

export default {
    install(app: App) {
        const eventBus:EventBus = mitt();
        app.config.globalProperties.$eventBus = eventBus;
        app.provide('eventBus', eventBus);
    }
};

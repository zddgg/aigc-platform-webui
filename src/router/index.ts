import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        redirect: "/text"
    },
    {
        path: "/text",
        name: "Text",
        component: () => import("@/views/text/index.vue")
    },
    {
        path: "/model",
        name: "Model",
        component: () => import("@/views/model/index.vue")
    },
    {
        path: "/text/novel",
        name: "Novel",
        component: () => import("@/views/text/novel/index.vue"),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 };
    },
});

export default router;

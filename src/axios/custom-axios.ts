// src/axios/customAxios.js
import axios, {type AxiosResponse} from 'axios';
import {HttpResponse} from "@/types/global.ts";
import {Message} from "@arco-design/web-vue";

const customAxios = axios.create();

// 不添加任何拦截器

export default customAxios;

customAxios.interceptors.response.use(
    (response: AxiosResponse<HttpResponse | any>) => {
        return response;
    },
    (error) => {
        Message.error({
            content: error.msg || 'Request Error',
            duration: 5 * 1000,
        });
        return Promise.reject(error);
    }
);
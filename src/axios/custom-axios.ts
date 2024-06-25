// src/axios/customAxios.js
import axios, {type AxiosResponse} from 'axios';
import {HttpResponse} from "@/types/global.ts";
import {Message} from "@arco-design/web-vue";

const customAxios = axios.create();

if (import.meta.env.VITE_API_BASE_URL && import.meta.env.MODE !== 'development') {
    customAxios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

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
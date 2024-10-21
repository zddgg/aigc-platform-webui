import type {AxiosResponse} from 'axios';
import axios, {AxiosRequestHeaders, InternalAxiosRequestConfig} from 'axios';
import {Message} from '@arco-design/web-vue';
import {HttpResponse} from '@/types/global.ts';

const dmpAxios = axios.create({
    baseURL: 'https://api666.xyz'
});

dmpAxios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (!config.headers) {
            config.headers = {} as AxiosRequestHeaders;
        }
        config.headers['Cache-Control'] = 'no-store,no-cache,must-revalidate';
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

dmpAxios.interceptors.response.use(
    (response: AxiosResponse<HttpResponse | any>) => {
        const res = response.data;
        if (res.code !== '0000') {
            Message.error({
                content: res.msg || 'Error',
                duration: 5 * 1000,
            });
            return Promise.reject(new Error(res.msg || 'Error'));
        }
        return res;
    },
    (error) => {
        console.log(error.message);
    }
);

export default dmpAxios;
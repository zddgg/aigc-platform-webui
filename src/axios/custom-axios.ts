import axios, {type AxiosResponse} from 'axios';
import {HttpResponse} from "@/types/global.ts";

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
    return Promise.reject(error);
  }
);
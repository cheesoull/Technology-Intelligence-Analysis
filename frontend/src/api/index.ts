import axios, { AxiosRequestConfig } from 'axios';

// 创建axios实例
const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 统一处理响应
    const { data } = response;
    // 根据记忆中的API格式，处理不同的状态码
    if (data.code === 200 || data.code === 0) {
      return data.data;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    // 统一处理错误
    const { response } = error;
    if (response) {
      // 根据状态码处理错误
      switch (response.status) {
        case 401:
          // 未授权处理
          break;
        case 403:
          // 禁止访问处理
          break;
        case 404:
          // 资源不存在处理
          break;
        case 500:
          // 服务器错误处理
          break;
        default:
          // 其他错误处理
          break;
      }
    }
    return Promise.reject(error);
  }
);

// 封装GET请求
export const get = <T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.get(url, { params, ...config });
};

// 封装POST请求
export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.post(url, data, config);
};

// 封装PUT请求
export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.put(url, data, config);
};

// 封装DELETE请求
export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.delete(url, config);
};

// 封装上传文件请求
export const upload = <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
  return instance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  });
};

// 导出API接口
export const API = {
  // 论文相关接口
  papers: {
    upload: (formData: FormData) => upload<any>('/papers/upload', formData),
    list: (page: number = 1, pageSize: number = 10) => get<any>(`/papers/list?page=${page}&pageSize=${pageSize}`),
  },
  // 博客相关接口
  blogs: {
    upload: (formData: FormData) => upload<any>('/blogs/upload', formData),
    list: (page: number = 1, pageSize: number = 10) => get<any>(`/blogs/list?page=${page}&pageSize=${pageSize}`),
  },
  // 聊天相关接口
  chat: {
    send: (message: string, context?: string) => post<any>('/chat/send', { message, context }),
    history: (conversationId: string) => get<any>(`/chat/history/${conversationId}`),
    list: () => get<any>('/chat/list'),
  },
};

export default instance;

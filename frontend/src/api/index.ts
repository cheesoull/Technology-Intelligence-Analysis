import axios, { AxiosRequestConfig } from 'axios';

// 创建axios实例
const instance = axios.create({
  timeout: 60000, // 超时时间 60 秒
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data
    });
   
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 统一处理响应
    console.log('收到响应:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        method: response.config.method,
        baseURL: response.config.baseURL
      }
    });
    
    const { data } = response;
    
    return data;
  },
  (error) => {
    console.error('响应错误:', error);
    
    if (error.response) {
      console.error('错误响应详情:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        config: {
          url: error.response.config.url,
          method: error.response.config.method,
          baseURL: error.response.config.baseURL
        }
      });
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('没有收到响应:', error.request);
    } else {
      // 设置请求时发生错误
      console.error('请求错误:', error.message);
    }
    
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
    upload: (formData: FormData) => upload<any>('/api/papers/upload', formData),
    list: (page: number = 1, pageSize: number = 10) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      return get<any>(`/api/papers/list?${params.toString()}`);
    },
    getById: (id: string) => get<any>(`/api/papers/${id}`),
  },
  // 博客相关接口
  blogs: {
    upload: (formData: FormData) => upload<any>('/api/blogs/upload', formData),
    list: (page: number = 1, pageSize: number = 10) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      return get<any>(`/api/blogs/list?${params.toString()}`);
    },
    getById: (id: string) => get<any>(`/api/blogs/${id}`),
  },
  // 聊天相关接口
  chat: {
    // 生成报告/对话
    ask: (sourceType: 'paper' | 'blog', sourceId: string | number, userQuestion: string) => 
      post<any>('/api/chat/ask', { sourceType, sourceId, userQuestion }),
    // 纯文本对话
    generate: (prompt: string, context?: string) => 
      post<{report: string}>('/api/generate', { prompt, context }),
    // 获取报告预览
    getReport: (reportId: string, page?: number, pageSize?: number) => 
      get<any>(`/api/reports/${reportId}${page ? `?page=${page}&pageSize=${pageSize}` : ''}`),
  },
};

export default instance;

import axios, { AxiosRequestConfig } from 'axios';

const instance = axios.create({
  timeout: 60000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
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
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求错误:', error.message);
    }
    const { response } = error;
    if (response) {
      switch (response.status) {
        case 401:
          break;
        case 403:
          break;
        case 404:
          break;
        case 500:
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export const get = <T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.get(url, { params, ...config });
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.post(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return instance.put(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.delete(url, config);
};

export const upload = <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
  return instance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  });
};

export const API = {
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
  chat: {
    ask: (sourceType: 'paper' | 'blog', sourceId: string | number, userQuestion: string) => 
      post<any>('/api/chat/ask', { sourceType, sourceId, userQuestion }),
    generate: (prompt: string, context?: string) => 
      post<{report: string}>('/api/generate', { prompt, context }),
    getReport: (reportId: string, page?: number, pageSize?: number) => 
      get<any>(`/api/reports/${reportId}${page ? `?page=${page}&pageSize=${pageSize}` : ''}`),
    list: () => get<any>('/api/chat/conversations'),
    history: (id: string) => get<any>(`/api/chat/conversations/${id}`),
    send: (content: string, context?: string) => post<any>('/api/chat/message', { content, context }),
  },
};

export default instance;

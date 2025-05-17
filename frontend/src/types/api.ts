import { Paper } from './paper';

// 定义API响应的通用接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  total?: number;
}

// 定义论文列表响应接口
export interface PaperListResponse {
  papers: Paper[];
  total: number;
}

// 定义可能的API响应格式
export type ApiResult = 
  | PaperListResponse 
  | ApiResponse<Paper[]> 
  | { papers: Paper[]; total: number; };

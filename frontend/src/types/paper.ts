export interface Paper {
  paper_id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  keywords: string[];
  category: string;
  url: string;
  citationCount: number;
  referenceCount: number;
  references: string[];
  citations: string[];
  createdAt: Date;
  venue?: string; // 期刊/会议信息
}
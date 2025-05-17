import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from './ui/Button';

// 设置 PDF.js worker - 使用本地模式
// 不使用 CDN 加载 worker
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, currentPage, onPageChange }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-4">
        <Button
          onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
          variant="outline"
          size="sm"
        >
          缩小
        </Button>
        <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
        <Button
          onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
          variant="outline"
          size="sm"
        >
          放大
        </Button>
      </div>

      <div className="relative">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-[800px]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>

      {numPages && (
        <div className="mt-4 flex items-center gap-4">
          <Button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {currentPage} 页，共 {numPages} 页
          </span>
          <Button
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            variant="outline"
            size="sm"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}; 
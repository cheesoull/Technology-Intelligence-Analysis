import React from 'react';
import { Button } from 'antd';

interface PaperAnalysisProps {
  analysis: {
    summary: string;
    keyPoints: string[];
    relatedFields: string[];
  };
  onExport: () => void;
}

export const PaperAnalysis: React.FC<PaperAnalysisProps> = ({ analysis, onExport }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">AI 解读</h2>
        <Button onClick={onExport} type="primary" ghost>
          导出报告
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">摘要</h3>
          <p className="text-gray-600">{analysis.summary}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">关键要点</h3>
          <ul className="list-disc pl-5 text-gray-600">
            {analysis.keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">相关领域</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.relatedFields.map((field, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
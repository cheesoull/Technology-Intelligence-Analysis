import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Paper {
  paper_id: string;
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
  referenceCount: number;
}

interface CitationChainProps {
  paperId: string;
  depth?: number;
}

export const CitationChain: React.FC<CitationChainProps> = ({ paperId, depth = 2 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citationChain, setCitationChain] = useState<{
    references: Paper[];
    citations: Paper[];
  }>({ references: [], citations: [] });

  useEffect(() => {
    const fetchCitationChain = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/papers/${paperId}/citation-chain?depth=${depth}`);
        if (!response.ok) {
          throw new Error('获取引用链失败');
        }
        const data = await response.json();
        setCitationChain(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取引用链失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCitationChain();
  }, [paperId, depth]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">引用链分析</h2>

      <div className="space-y-8">
        {/* 参考文献 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            参考文献 ({citationChain.references.length})
          </h3>
          <div className="space-y-4">
            {citationChain.references.map((paper) => (
              <Link
                key={paper.paper_id}
                to={`/paper/${paper.paper_id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                  {paper.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {paper.authors.join(', ')} • {paper.year}
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>引用数: {paper.citationCount}</span>
                  <span>参考文献: {paper.referenceCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 被引用论文 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            被引用论文 ({citationChain.citations.length})
          </h3>
          <div className="space-y-4">
            {citationChain.citations.map((paper) => (
              <Link
                key={paper.paper_id}
                to={`/paper/${paper.paper_id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                  {paper.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {paper.authors.join(', ')} • {paper.year}
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>引用数: {paper.citationCount}</span>
                  <span>参考文献: {paper.referenceCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
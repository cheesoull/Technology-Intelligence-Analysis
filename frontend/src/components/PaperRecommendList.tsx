import React from 'react';
import { Link } from 'react-router-dom';

interface Paper {
  paper_id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  keywords: string[];
}

interface PaperRecommendListProps {
  papers: Paper[];
  loading?: boolean;
}

export const PaperRecommendList: React.FC<PaperRecommendListProps> = ({ papers, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <Link
          key={paper.paper_id}
          to={`/paper/${paper.paper_id}`}
          className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {paper.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {paper.authors.join(', ')} • {paper.year}
          </p>
          <p className="text-gray-700 text-sm line-clamp-2 mb-3">{paper.abstract}</p>
          <div className="flex flex-wrap gap-2">
            {paper.keywords.slice(0, 3).map((keyword) => (
              <span
                key={keyword}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}; 
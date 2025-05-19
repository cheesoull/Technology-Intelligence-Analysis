// 生成报告/对话
async function askChat(params: { sourceType: string; sourceId: number; userQuestion: string }) {
  const response = await fetch('/api/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('生成报告失败');
  return await response.json();
}

// 上传论文
async function uploadPaper(file: File, title = '', author = '', abstract = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('author', author);
  formData.append('abstract', abstract);

  const response = await fetch('/api/papers/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('上传论文失败');
  return await response.json();
} 
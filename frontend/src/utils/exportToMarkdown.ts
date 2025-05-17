/**
 * 将内容导出为Markdown文件
 * @param content Markdown格式的内容
 * @param filename 文件名（不含扩展名）
 */
export const exportToMarkdown = (content: string, filename: string = 'report'): void => {
  // 创建Blob对象
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  
  // 触发下载
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToMarkdown;

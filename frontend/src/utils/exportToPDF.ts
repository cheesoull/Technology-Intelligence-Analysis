import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 将HTML元素导出为PDF文件
 * @param element 要导出的HTML元素
 * @param filename 文件名（不含扩展名）
 */
export const exportElementToPDF = async (
  element: HTMLElement, 
  filename: string = 'report'
): Promise<void> => {
  try {
    // 使用html2canvas将元素转换为canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      logging: false, // 关闭日志
    });
    
    // 获取canvas的宽高
    const imgWidth = 210; // A4宽度，单位mm
    const pageHeight = 295; // A4高度，单位mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const heightLeft = imgHeight;
    
    // 创建PDF实例
    const pdf = new jsPDF('p', 'mm', 'a4');
    const position = 0;
    
    // 将canvas添加到PDF
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      0, 
      position, 
      imgWidth, 
      imgHeight
    );
    
    // 如果内容超过一页，添加新页面
    let heightRemaining = heightLeft - pageHeight;
    let currentPosition = -pageHeight;
    
    while (heightRemaining > 0) {
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        0, 
        currentPosition, 
        imgWidth, 
        imgHeight
      );
      heightRemaining -= pageHeight;
      currentPosition -= pageHeight;
    }
    
    // 保存PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('导出PDF失败:', error);
    throw error;
  }
};

/**
 * 将Markdown内容转换为PDF并导出
 * @param content Markdown内容
 * @param filename 文件名（不含扩展名）
 */
export const exportMarkdownToPDF = async (
  content: string, 
  filename: string = 'report'
): Promise<void> => {
  try {
    // 创建临时div元素
    const tempDiv = document.createElement('div');
    tempDiv.className = 'markdown-body';
    tempDiv.style.padding = '20px';
    tempDiv.style.width = '210mm'; // A4宽度
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    // 将Markdown内容渲染为HTML
    // 注意：这里简单处理，实际项目中应使用react-markdown或其他库
    tempDiv.innerHTML = content
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/#{6}\s(.*?)\s*$/gm, '<h6>$1</h6>')
      .replace(/#{5}\s(.*?)\s*$/gm, '<h5>$1</h5>')
      .replace(/#{4}\s(.*?)\s*$/gm, '<h4>$1</h4>')
      .replace(/#{3}\s(.*?)\s*$/gm, '<h3>$1</h3>')
      .replace(/#{2}\s(.*?)\s*$/gm, '<h2>$1</h2>')
      .replace(/#{1}\s(.*?)\s*$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    
    // 添加到文档
    document.body.appendChild(tempDiv);
    
    // 导出为PDF
    await exportElementToPDF(tempDiv, filename);
    
    // 清理
    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('导出PDF失败:', error);
    throw error;
  }
};

export default exportMarkdownToPDF;

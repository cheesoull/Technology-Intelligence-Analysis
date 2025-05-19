import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportElementToPDF = async (
  element: HTMLElement, 
  filename: string = 'report'
): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true, 
      logging: false, 
    });
    
    const imgWidth = 210; 
    const pageHeight = 295; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const heightLeft = imgHeight;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const position = 0;
    
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      0, 
      position, 
      imgWidth, 
      imgHeight
    );
    
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
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('导出PDF失败:', error);
    throw error;
  }
};

export const exportMarkdownToPDF = async (
  content: string, 
  filename: string = 'report'
): Promise<void> => {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'markdown-body';
    tempDiv.style.padding = '20px';
    tempDiv.style.width = '210mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
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
    document.body.appendChild(tempDiv);  
    await exportElementToPDF(tempDiv, filename);
    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('导出PDF失败:', error);
    throw error;
  }
};

export default exportMarkdownToPDF;

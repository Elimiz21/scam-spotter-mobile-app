// Safe utility functions for exporting policy content

export const downloadPolicyAsText = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const text = element.innerText || element.textContent || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export const viewPolicyAsHTML = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    // Create a safe copy of the content
    const tempDiv = document.createElement('div');
    tempDiv.textContent = element.textContent || '';
    
    // Create the HTML structure safely
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          h2 { 
            color: #34495e; 
            margin-top: 30px; 
            margin-bottom: 15px;
          }
          h3 {
            color: #7f8c8d;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p { 
            margin-bottom: 15px; 
          }
          ul, ol {
            margin-bottom: 15px;
            padding-left: 30px;
          }
          li {
            margin-bottom: 8px;
          }
          .policy-section {
            margin-bottom: 30px;
          }
          .effective-date {
            font-style: italic;
            color: #7f8c8d;
            margin-bottom: 20px;
          }
          @media print {
            body {
              font-size: 12pt;
            }
          }
        </style>
      </head>
      <body>
        <div class="policy-content">
          ${formatPolicyContent(element)}
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      // Use a safer approach with document.open/close
      newWindow.document.open();
      // Split the HTML to avoid direct script injection
      const safeHtml = html.replace(/<script/gi, '&lt;script').replace(/<\/script/gi, '&lt;/script');
      // Write the content in chunks to avoid potential injection
      newWindow.document.write(safeHtml);
      newWindow.document.close();
    }
  }
};

// Safely escape HTML entities
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Format policy content preserving structure but escaping HTML
const formatPolicyContent = (element: HTMLElement): string => {
  const content: string[] = [];
  
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        content.push(escapeHtml(text));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          content.push(`<${tagName}>${escapeHtml(el.textContent || '')}</${tagName}>`);
          break;
        case 'p':
          content.push(`<p>${escapeHtml(el.textContent || '')}</p>`);
          break;
        case 'ul':
        case 'ol':
          content.push(`<${tagName}>`);
          el.childNodes.forEach(child => {
            if ((child as HTMLElement).tagName?.toLowerCase() === 'li') {
              content.push(`<li>${escapeHtml(child.textContent || '')}</li>`);
            }
          });
          content.push(`</${tagName}>`);
          break;
        case 'div':
        case 'section':
          const className = el.className;
          if (className) {
            content.push(`<div class="${escapeHtml(className)}">`);
          } else {
            content.push('<div>');
          }
          el.childNodes.forEach(child => processNode(child));
          content.push('</div>');
          break;
        default:
          el.childNodes.forEach(child => processNode(child));
      }
    }
  };
  
  element.childNodes.forEach(child => processNode(child));
  
  return content.join('\n');
};

// Export utility for downloading as PDF (using browser print)
export const downloadPolicyAsPDF = (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(title)}</title>
          <style>
            @page { margin: 1in; }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
            }
            h1 { font-size: 18pt; margin-bottom: 12pt; }
            h2 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin-bottom: 6pt; text-align: justify; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${formatPolicyContent(element)}
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html.replace(/<script/gi, '&lt;script').replace(/<\/script/gi, '&lt;/script'));
      printWindow.document.close();
    }
  }
};
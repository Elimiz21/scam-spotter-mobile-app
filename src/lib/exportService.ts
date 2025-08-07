import { jsPDF } from 'jspdf';
import { AnalysisResult } from '../services/types';

export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv' | 'html';
  includeDetails: boolean;
  includeCharts: boolean;
  dateRange: string;
}

class ExportService {
  async exportAnalysisResults(
    results: AnalysisResult, 
    options: ExportOptions = {
      format: 'pdf',
      includeDetails: true,
      includeCharts: false,
      dateRange: 'all_time'
    }
  ): Promise<void> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(results, options);
      case 'json':
        return this.exportToJSON(results, options);
      case 'csv':
        return this.exportToCSV(results, options);
      case 'html':
        return this.exportToHTML(results, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToPDF(results: AnalysisResult, options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Scam Dunk Analysis Report', 20, yPosition);
    yPosition += 15;

    // Timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    doc.text(`Analysis ID: ${results.analysisId}`, 20, yPosition + 5);
    yPosition += 20;

    // Overall Risk Score
    doc.setFontSize(16);
    doc.text('Overall Risk Assessment', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    const riskLevel = this.getRiskLevel(results.overallRiskScore);
    doc.text(`Risk Score: ${results.overallRiskScore}/100 (${riskLevel})`, 20, yPosition);
    yPosition += 15;

    // Risk Vectors
    doc.setFontSize(14);
    doc.text('Analysis Details:', 20, yPosition);
    yPosition += 10;

    results.riskVectors.forEach((vector) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text(`${vector.name}: ${vector.riskScore}/100`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Status: ${vector.status.toUpperCase()}`, 25, yPosition);
      yPosition += 5;
      
      doc.text(`Summary: ${vector.summary}`, 25, yPosition);
      yPosition += 8;

      if (options.includeDetails && vector.findings) {
        doc.text('Key Findings:', 25, yPosition);
        yPosition += 5;

        vector.findings.forEach((finding) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const lines = doc.splitTextToSize(`• ${finding}`, 160);
          doc.text(lines, 30, yPosition);
          yPosition += lines.length * 5;
        });
      }
      yPosition += 10;
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Scam Dunk Analysis Report - Page ${i} of ${pageCount}`,
        20,
        290
      );
      doc.text(
        'This report is for informational purposes only. Please verify findings independently.',
        20,
        295
      );
    }

    doc.save(`scam-analysis-${results.analysisId}.pdf`);
  }

  private async exportToJSON(results: AnalysisResult, options: ExportOptions): Promise<void> {
    const exportData = {
      exportInfo: {
        format: 'json',
        generatedAt: new Date().toISOString(),
        exportOptions: options,
      },
      analysisResults: results,
    };

    if (!options.includeDetails) {
      // Remove detailed findings if not requested
      exportData.analysisResults.riskVectors = results.riskVectors.map(vector => ({
        ...vector,
        findings: undefined,
        details: undefined,
      }));
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `scam-analysis-${results.analysisId}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  private async exportToCSV(results: AnalysisResult, options: ExportOptions): Promise<void> {
    const csvHeader = [
      'Risk Vector',
      'Risk Score',
      'Status',
      'Summary',
      ...(options.includeDetails ? ['Details', 'Key Findings'] : [])
    ];

    const csvRows = [csvHeader.join(',')];

    // Add overall risk row
    csvRows.push([
      'Overall Risk Assessment',
      results.overallRiskScore.toString(),
      this.getRiskLevel(results.overallRiskScore),
      'Combined risk assessment across all vectors',
      ...(options.includeDetails ? ['', ''] : [])
    ].map(field => `"${field.replace(/"/g, '""')}"`).join(','));

    // Add individual risk vectors
    results.riskVectors.forEach(vector => {
      const row = [
        vector.name,
        vector.riskScore.toString(),
        vector.status,
        vector.summary,
      ];

      if (options.includeDetails) {
        row.push(vector.details || '');
        row.push(vector.findings?.join('; ') || '');
      }

      csvRows.push(row.map(field => `"${field.replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `scam-analysis-${results.analysisId}.csv`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  private async exportToHTML(results: AnalysisResult, options: ExportOptions): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scam Dunk Analysis Report - ${results.analysisId}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .risk-score {
            font-size: 2em;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .risk-high { background-color: #fee2e2; color: #dc2626; }
        .risk-medium { background-color: #fef3c7; color: #d97706; }
        .risk-low { background-color: #dcfce7; color: #16a34a; }
        .risk-vector {
            background: white;
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #e5e7eb;
        }
        .risk-vector.danger { border-left-color: #dc2626; }
        .risk-vector.warning { border-left-color: #d97706; }
        .risk-vector.safe { border-left-color: #16a34a; }
        .findings {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .findings ul {
            margin: 0;
            padding-left: 20px;
        }
        .footer {
            margin-top: 40px;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 10px;
            font-size: 0.9em;
            color: #6b7280;
        }
        @media print {
            body { background-color: white; }
            .header { background: #333 !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Scam Dunk Analysis Report</h1>
        <p><strong>Analysis ID:</strong> ${results.analysisId}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Timestamp:</strong> ${results.timestamp}</p>
    </div>

    <div class="risk-score ${this.getRiskScoreClass(results.overallRiskScore)}">
        Overall Risk Score: ${results.overallRiskScore}/100
        <br>
        <small>Risk Level: ${this.getRiskLevel(results.overallRiskScore).toUpperCase()}</small>
    </div>

    <h2>📊 Analysis Details</h2>
    ${results.riskVectors.map(vector => `
        <div class="risk-vector ${vector.status}">
            <h3>${vector.icon} ${vector.name}</h3>
            <p><strong>Risk Score:</strong> ${vector.riskScore}/100</p>
            <p><strong>Status:</strong> ${vector.status.toUpperCase()}</p>
            <p><strong>Summary:</strong> ${vector.summary}</p>
            
            ${options.includeDetails && vector.details ? `
                <p><strong>Details:</strong> ${vector.details}</p>
            ` : ''}
            
            ${options.includeDetails && vector.findings?.length ? `
                <div class="findings">
                    <strong>Key Findings:</strong>
                    <ul>
                        ${vector.findings.map(finding => `<li>${finding}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('')}

    <div class="footer">
        <p><strong>Disclaimer:</strong> This analysis report is for informational purposes only. The findings should be verified independently, and this report does not constitute financial, legal, or investment advice.</p>
        <p><strong>Generated by:</strong> Scam Dunk - Advanced Scam Detection System</p>
        <p><strong>Export Options:</strong> Format: ${options.format}, Details: ${options.includeDetails ? 'Yes' : 'No'}</p>
    </div>
</body>
</html>`;

    const dataBlob = new Blob([html], { type: 'text/html' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `scam-analysis-${results.analysisId}.html`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  private getRiskLevel(score: number): string {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  }

  private getRiskScoreClass(score: number): string {
    if (score < 30) return 'risk-low';
    if (score < 70) return 'risk-medium';
    return 'risk-high';
  }

  // Batch export multiple analyses
  async exportMultipleAnalyses(
    analyses: AnalysisResult[], 
    options: ExportOptions
  ): Promise<void> {
    if (options.format === 'pdf') {
      const doc = new jsPDF();
      let isFirstPage = true;

      for (const results of analyses) {
        if (!isFirstPage) {
          doc.addPage();
        }
        
        // Add analysis to PDF (simplified version)
        doc.setFontSize(16);
        doc.text(`Analysis: ${results.analysisId}`, 20, 20);
        doc.text(`Risk Score: ${results.overallRiskScore}/100`, 20, 35);
        doc.text(`Date: ${new Date(results.timestamp).toLocaleDateString()}`, 20, 50);
        
        isFirstPage = false;
      }

      doc.save('scam-analyses-batch.pdf');
    } else {
      // For other formats, create a combined export
      const exportData = {
        exportInfo: {
          format: options.format,
          generatedAt: new Date().toISOString(),
          exportOptions: options,
          totalAnalyses: analyses.length,
        },
        analyses: analyses,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `scam-analyses-batch.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    }
  }
}

export const exportService = new ExportService();
import React, { useRef } from 'react';
import { useChatlog } from '@/contexts/ChatlogContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReportPage: React.FC = () => {
  const { evaluationResults, selectedModel, promptTemplate, rubricText } = useChatlog();
  const reportRef = useRef<HTMLDivElement>(null);

  // Calculate averages
  const calculateAverage = (scores: number[]) => {
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00';
  };

  const averageCoherence = calculateAverage(evaluationResults.map(r => r.coherence));
  const averagePoliteness = calculateAverage(evaluationResults.map(r => r.politeness));
  const averageRelevance = calculateAverage(evaluationResults.map(r => r.relevance));
  
  // Calculate resolution stats
  const resolvedCount = evaluationResults.filter(r => r.resolution === 1).length;
  const resolutionRate = evaluationResults.length ? 
    ((resolvedCount / evaluationResults.length) * 100).toFixed(1) : '0.0';

  // Calculate score distributions
  const calculateDistribution = (scores: number[]) => {
    const low = scores.filter(s => s <= 2).length;
    const medium = scores.filter(s => s === 3).length;
    const high = scores.filter(s => s >= 4).length;
    return { low, medium, high };
  };

  const coherenceDist = calculateDistribution(evaluationResults.map(r => r.coherence));
  const politenessDist = calculateDistribution(evaluationResults.map(r => r.politeness));
  const relevanceDist = calculateDistribution(evaluationResults.map(r => r.relevance));

  // Find chatlogs for review
  const flaggedChatlogs = evaluationResults.filter(
    r => (r.resolution === 0 && r.politeness <= 2) || r.coherence <= 2
  ).slice(0, 3);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    // Create a temporary div for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.className = 'pdf-content';
    pdfContent.innerHTML = `
      <style>
        .pdf-content {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          padding: 40px;
        }
        .pdf-header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #0A2463;
          padding-bottom: 20px;
        }
        .pdf-header h1 {
          color: #0A2463;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .pdf-header p {
          color: #666;
          font-size: 14px;
          margin: 5px 0;
        }
        .pdf-section {
          margin-bottom: 30px;
        }
        .pdf-section h2 {
          color: #0A2463;
          font-size: 18px;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .pdf-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .pdf-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
        }
        .pdf-card h3 {
          color: #0A2463;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .pdf-metric {
          font-size: 24px;
          font-weight: bold;
          color: #0A2463;
          margin-bottom: 5px;
        }
        .pdf-subtext {
          font-size: 12px;
          color: #666;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .pdf-table th, .pdf-table td {
          border: 1px solid #dee2e6;
          padding: 8px;
          text-align: left;
        }
        .pdf-table th {
          background: #f8f9fa;
          font-weight: bold;
        }
        .pdf-chatlog {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .pdf-chatlog p {
          margin-bottom: 10px;
        }
        .pdf-scores {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .pdf-score {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 5px;
          text-align: center;
          font-size: 12px;
        }
        .pdf-code {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 15px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          margin: 10px 0;
        }
        .pdf-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
      <div class="pdf-header">
        <h1>Chatlog Evaluation Report</h1>
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
        <p>Model Used: ${selectedModel}</p>
        <p>Total Chatlogs Analyzed: ${evaluationResults.length}</p>
      </div>

      <div class="pdf-section">
        <h2>Overall Performance Metrics</h2>
        <div class="pdf-grid">
          <div class="pdf-card">
            <h3>Average Coherence</h3>
            <div class="pdf-metric">${averageCoherence}/5</div>
          </div>
          <div class="pdf-card">
            <h3>Average Politeness</h3>
            <div class="pdf-metric">${averagePoliteness}/5</div>
          </div>
          <div class="pdf-card">
            <h3>Average Relevance</h3>
            <div class="pdf-metric">${averageRelevance}/5</div>
          </div>
          <div class="pdf-card">
            <h3>Resolution Rate</h3>
            <div class="pdf-metric">${resolutionRate}%</div>
            <div class="pdf-subtext">${resolvedCount} of ${evaluationResults.length} resolved</div>
          </div>
        </div>
      </div>

      <div class="pdf-section">
        <h2>Score Distribution</h2>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Low (1-2)</th>
              <th>Medium (3)</th>
              <th>High (4-5)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Coherence</td>
              <td>${coherenceDist.low} (${((coherenceDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${coherenceDist.medium} (${((coherenceDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${coherenceDist.high} (${((coherenceDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
            </tr>
            <tr>
              <td>Politeness</td>
              <td>${politenessDist.low} (${((politenessDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${politenessDist.medium} (${((politenessDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${politenessDist.high} (${((politenessDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
            </tr>
            <tr>
              <td>Relevance</td>
              <td>${relevanceDist.low} (${((relevanceDist.low / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${relevanceDist.medium} (${((relevanceDist.medium / evaluationResults.length) * 100).toFixed(1)}%)</td>
              <td>${relevanceDist.high} (${((relevanceDist.high / evaluationResults.length) * 100).toFixed(1)}%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <h2>Resolution Breakdown</h2>
        <div class="pdf-grid">
          <div class="pdf-card">
            <h3>Resolved Chatlogs</h3>
            <div class="pdf-metric">${resolvedCount}</div>
            <div class="pdf-subtext">${resolutionRate}%</div>
          </div>
          <div class="pdf-card">
            <h3>Unresolved Chatlogs</h3>
            <div class="pdf-metric">${evaluationResults.length - resolvedCount}</div>
            <div class="pdf-subtext">${(100 - Number(resolutionRate)).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      ${flaggedChatlogs.length > 0 ? `
        <div class="pdf-section">
          <h2>Chatlogs Flagged for Review</h2>
          ${flaggedChatlogs.map(chatlog => `
            <div class="pdf-chatlog">
              <p>${chatlog.chatlog?.slice(0, 100) || 'No chatlog text available'}...</p>
              <div class="pdf-scores">
                <div class="pdf-score">Coherence: ${chatlog.coherence}</div>
                <div class="pdf-score">Politeness: ${chatlog.politeness}</div>
                <div class="pdf-score">Relevance: ${chatlog.relevance}</div>
                <div class="pdf-score">Resolution: ${chatlog.resolution}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="pdf-section">
        <h2>Evaluation Context</h2>
        <h3>Prompt Template</h3>
        <div class="pdf-code">${promptTemplate}</div>
        <h3>Rubric</h3>
        <div class="pdf-code">${rubricText}</div>
      </div>

      <div class="pdf-footer">
        <p>Generated by ChatScribe - Chatlog Quality Analyzer</p>
        <p>© ${new Date().getFullYear()} All rights reserved</p>
      </div>
    `;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `chatlog-evaluation-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(pdfContent).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (evaluationResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-app-blue dark:text-white">Evaluation Report</h1>
          <p className="mt-1 text-app-text dark:text-gray-300">No evaluation results available. Please analyze some chatlogs first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e8ecf3] to-[#f5f7fa] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-2 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-app-blue dark:text-white">Evaluation Report</h1>
        <p className="mt-1 text-app-text dark:text-gray-300">Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')} using {selectedModel}</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <div ref={reportRef} className="space-y-8">
          {/* Overall Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Average Coherence</CardTitle>
              <div className="text-3xl font-bold text-app-text dark:text-white mt-2">{averageCoherence} <span className="text-base font-normal">/ 5</span></div>
            </Card>
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Average Politeness</CardTitle>
              <div className="text-3xl font-bold text-app-text dark:text-white mt-2">{averagePoliteness} <span className="text-base font-normal">/ 5</span></div>
            </Card>
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Average Relevance</CardTitle>
              <div className="text-3xl font-bold text-app-text dark:text-white mt-2">{averageRelevance} <span className="text-base font-normal">/ 5</span></div>
            </Card>
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Resolution Rate</CardTitle>
              <div className="text-3xl font-bold text-app-text dark:text-white mt-2">{resolutionRate}%</div>
              <div className="text-base text-muted-foreground">${resolvedCount} of ${evaluationResults.length} resolved</div>
            </Card>
          </div>

          {/* Score Distribution Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Coherence', dist: coherenceDist },
              { title: 'Politeness', dist: politenessDist },
              { title: 'Relevance', dist: relevanceDist }
            ].map(({ title, dist }) => (
              <Card key={title} className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
                <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">{title} Score Breakdown</CardTitle>
                <div className="text-3xl font-bold text-app-text dark:text-white mt-2">
                  Low (1-2): {dist.low} logs ({((dist.low / evaluationResults.length) * 100).toFixed(1)}%)
                </div>
                <div className="text-3xl font-bold text-app-text dark:text-white mt-2">
                  Medium (3): {dist.medium} logs ({((dist.medium / evaluationResults.length) * 100).toFixed(1)}%)
                </div>
                <div className="text-3xl font-bold text-app-text dark:text-white mt-2">
                  High (4-5): {dist.high} logs ({((dist.high / evaluationResults.length) * 100).toFixed(1)}%)
                </div>
              </Card>
            ))}
          </div>

          {/* Resolution Breakdown */}
          <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
            <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Resolution Breakdown</CardTitle>
            <div className="text-3xl font-bold text-app-text dark:text-white mt-2">
              Resolved Chatlogs: {resolvedCount}
            </div>
            <div className="text-3xl font-bold text-app-text dark:text-white mt-2">
              Unresolved Chatlogs: {evaluationResults.length - resolvedCount}
            </div>
            <div className="text-base text-muted-foreground">
              {resolutionRate}%
            </div>
          </Card>

          {/* Chatlogs for Review */}
          {flaggedChatlogs.length > 0 && (
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Sample Chatlogs Flagged for Review</CardTitle>
              <div className="space-y-4">
                {flaggedChatlogs.map((chatlog, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-gray-900/60 rounded-lg border border-border/40 dark:border-gray-700">
                    <p className="text-sm mb-3 dark:text-gray-200">{chatlog.chatlog?.slice(0, 100) || 'No chatlog text available'}...</p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-center dark:bg-red-900/60 dark:text-red-200">Coherence: {chatlog.coherence}</div>
                      <div className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-center dark:bg-red-900/60 dark:text-red-200">Politeness: {chatlog.politeness}</div>
                      <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-center dark:bg-yellow-900/60 dark:text-yellow-200">Relevance: {chatlog.relevance}</div>
                      <div className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-center dark:bg-red-900/60 dark:text-red-200">Resolution: {chatlog.resolution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Evaluation Context */}
          <div className="space-y-4">
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Prompt Template Used</CardTitle>
              <div className="text-base font-normal text-app-text dark:text-gray-200">
                <pre className="bg-white/50 dark:bg-gray-900/80 p-4 rounded-lg overflow-x-auto text-sm border border-border/40 dark:text-gray-200">
                  {promptTemplate}
                </pre>
              </div>
            </Card>
            <Card className="bg-white/60 dark:bg-gray-900/80 shadow rounded-2xl p-6 flex flex-col items-center">
              <CardTitle className="text-lg font-semibold text-app-text dark:text-white text-center">Rubric Used</CardTitle>
              <div className="text-base font-normal text-app-text dark:text-gray-200">
                <pre className="bg-white/50 dark:bg-gray-900/80 p-4 rounded-lg overflow-x-auto text-sm border border-border/40 dark:text-gray-200">
                  {rubricText}
                </pre>
              </div>
            </Card>
          </div>
        </div>

        {/* Export PDF Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleExportPDF}
            className="bg-app-blue hover:bg-app-blue/90 text-white px-6 py-2 rounded-full shadow-lg flex items-center space-x-2 dark:bg-app-blue/80 dark:hover:bg-app-blue/60 dark:text-white"
          >
            <Download className="w-4 h-4" />
            <span>Save as PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage; 
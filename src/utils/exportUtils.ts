import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportableData {
  [key: string]: any;
}

export const exportToCSV = (data: ExportableData[], filename: string) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]).filter(key => key !== 'expandedContent');
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle special cases
        if (header === 'resolution') {
          return value === 1 ? 'Resolved' : 'Unresolved';
        }
        // Wrap strings in quotes and escape any existing quotes
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportableData[], filename: string) => {
  // Remove expandedContent from data
  const exportData = data.map(({ expandedContent, ...rest }) => rest);
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}; 
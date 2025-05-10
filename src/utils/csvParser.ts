
export const parseCSV = (csvContent: string): string[] => {
  // Split by lines
  const lines = csvContent.split(/\r\n|\n/);
  
  // Find the header row and locate the "Chatlog" column index
  const headers = lines[0].split(',');
  const chatlogIndex = headers.findIndex(
    header => header.trim().toLowerCase() === 'chatlog'
  );

  // If we can't find a "Chatlog" column, throw an error
  if (chatlogIndex === -1) {
    throw new Error('CSV file must contain a "Chatlog" column');
  }

  // Extract the chatlog values from each row
  const chatlogs: string[] = [];
  
  // Skip the header row (i=0) and process data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    // Split the line by comma, but handle quoted fields properly
    const row = parseCSVRow(lines[i]);
    
    // Add the chatlog to our array if it exists
    if (row.length > chatlogIndex && row[chatlogIndex]) {
      chatlogs.push(row[chatlogIndex]);
    }
  }
  
  return chatlogs;
};

// Helper function to handle CSV row parsing with quotes
function parseCSVRow(rowStr: string): string[] {
  const row: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Don't forget to add the last value
  row.push(currentValue);
  
  return row;
}

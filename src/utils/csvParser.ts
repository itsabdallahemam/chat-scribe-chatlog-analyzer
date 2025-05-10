// src/utils/csvParser.ts

export const parseCSV = (csvContent: string): string[] => {
  // --- Robust Line Splitting ---
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    currentLine += char;

    if (char === '"') {
      // Basic toggle for quote state, doesn't handle escaped quotes perfectly here
      // but helps with newlines inside quotes.
      // A full CSV parser would handle "" for escaped quotes within this logic.
      inQuotes = !inQuotes;
    }

    // Split on newline characters ONLY if not inside quotes
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (csvContent[i + 1] === '\n' && char === '\r') { // Handle \r\n
        i++; // Consume the \n part of \r\n
      }
      // Add trimmed line, but only if it's not just whitespace from the split
      const trimmedLine = currentLine.trim();
      if (trimmedLine) {
          lines.push(trimmedLine);
      }
      currentLine = ''; // Reset for the next logical line
    }
  }
  // Add the last line if it has content
  const trimmedLastLine = currentLine.trim();
  if (trimmedLastLine) {
    lines.push(trimmedLastLine);
  }
  // --- End Robust Line Splitting ---


  if (lines.length === 0) {
    console.warn("CSV Parser: No lines found after attempting robust split.");
    return [];
  }

  // Find the header row and locate the "Chatlog" column index
  const headers = parseCSVRow(lines[0]); // Use robust row parser for headers
  const chatlogIndex = headers.findIndex(
    (header) => header.trim().toLowerCase() === 'chatlog'
  );

  if (chatlogIndex === -1) {
    console.error("CSV Parser Error: Headers found:", headers);
    throw new Error('CSV file must contain a "Chatlog" column (case-insensitive). Check for extra spaces or typos in the header.');
  }

  const chatlogs: string[] = [];

  // Skip the header row (i=0) and process data rows
  for (let i = 1; i < lines.length; i++) {
    const lineContent = lines[i]; // Already trimmed by the robust splitter
    if (!lineContent) continue;

    const row = parseCSVRow(lineContent);

    if (row.length > chatlogIndex && row[chatlogIndex] !== undefined && row[chatlogIndex] !== null) {
      let chatlogContent = row[chatlogIndex].trim();
      // Remove potential surrounding quotes from the chatlog content itself
      // and handle escaped double quotes "" -> "
      if (chatlogContent.startsWith('"') && chatlogContent.endsWith('"')) {
        chatlogContent = chatlogContent.substring(1, chatlogContent.length - 1).replace(/""/g, '"');
      }
      chatlogs.push(chatlogContent);
    } else {
      // console.warn(`CSV Parser: Skipping row ${i + 1}. Chatlog column missing or row too short. Row data:`, row);
    }
  }
  console.log(`CSV Parser: Successfully parsed ${chatlogs.length} chatlogs.`);
  return chatlogs;
};

// Improved helper function to handle CSV row parsing with quotes (from previous version)
function parseCSVRow(rowStr: string): string[] {
  const row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];

    if (char === '"') {
      if (inQuotes && i + 1 < rowStr.length && rowStr[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  row.push(currentField.trim());
  return row;
}

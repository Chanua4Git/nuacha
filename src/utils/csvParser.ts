import { format, parse } from 'date-fns';

export interface CSVExpenseRow {
  amount: string;
  description: string;
  place: string;
  date: Date;
}

export interface ParsedCSVResult {
  data: CSVExpenseRow[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

// Common date formats to try parsing
const DATE_FORMATS = [
  'MM/dd/yyyy',
  'dd/MM/yyyy', 
  'yyyy-MM-dd',
  'M/d/yyyy',
  'd/M/yyyy',
  'MM-dd-yyyy',
  'dd-MM-yyyy'
];

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Try parsing with different formats
  for (const format of DATE_FORMATS) {
    try {
      const parsed = parse(dateStr.trim(), format, new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      // Continue to next format
    }
  }
  
  // Try native Date parsing as fallback
  try {
    const parsed = new Date(dateStr.trim());
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (error) {
    // Failed to parse
  }
  
  return null;
};

export const generateCSVTemplate = (): string => {
  const headers = ['Amount', 'Description', 'Place', 'Date'];
  const sampleData = [
    ['25.50', 'Grocery shopping', 'SuperMarket', '01/15/2024'],
    ['12.99', 'Coffee', 'Cafe Downtown', '01/15/2024'],
    ['150.00', 'Gas bill', 'Online Payment', '01/14/2024']
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSVTemplate = () => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSV = (csvText: string): ParsedCSVResult => {
  const errors: string[] = [];
  const data: CSVExpenseRow[] = [];
  
  try {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      return {
        data: [],
        errors: ['CSV file must contain at least a header row and one data row'],
        totalRows: 0,
        validRows: 0
      };
    }
    
    // Parse header to detect column positions
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Find column indices
    const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('price'));
    const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('item') || h.includes('expense'));
    const placeIndex = headers.findIndex(h => h.includes('place') || h.includes('store') || h.includes('merchant') || h.includes('vendor'));
    const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('when'));
    
    if (amountIndex === -1) {
      errors.push('Could not find Amount column. Please ensure your CSV has an "Amount" column.');
    }
    if (descriptionIndex === -1) {
      errors.push('Could not find Description column. Please ensure your CSV has a "Description" column.');
    }
    
    if (errors.length > 0) {
      return {
        data: [],
        errors,
        totalRows: lines.length - 1,
        validRows: 0
      };
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      try {
        const amountStr = columns[amountIndex]?.replace(/[^0-9.-]/g, '') || '';
        const description = columns[descriptionIndex] || '';
        const place = columns[placeIndex] || 'Not specified';
        const dateStr = columns[dateIndex] || '';
        
        // Validate required fields
        if (!amountStr || !description) {
          errors.push(`Row ${i + 1}: Missing required fields (Amount or Description)`);
          continue;
        }
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
          continue;
        }
        
        let parsedDate = new Date();
        if (dateStr) {
          const parsed = parseDate(dateStr);
          if (parsed) {
            parsedDate = parsed;
          } else {
            errors.push(`Row ${i + 1}: Invalid date format "${dateStr}". Using today's date instead.`);
          }
        }
        
        data.push({
          amount: amount.toString(),
          description: description.substring(0, 255), // Limit description length
          place: place.substring(0, 255), // Limit place length
          date: parsedDate
        });
        
      } catch (error) {
        errors.push(`Row ${i + 1}: Error parsing data - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      data,
      errors,
      totalRows: lines.length - 1,
      validRows: data.length
    };
    
  } catch (error) {
    return {
      data: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
      totalRows: 0,
      validRows: 0
    };
  }
};

export const parseExcel = async (file: File): Promise<ParsedCSVResult> => {
  // For Excel files, we'll convert them to CSV first
  // This is a basic implementation - in production you might want to use a library like xlsx
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // This is a simplified approach - convert Excel to text and try to parse
        // In a real implementation, you'd use the 'xlsx' library for proper Excel parsing
        const text = e.target?.result as string;
        
        // For now, we'll just return an error suggesting CSV format
        resolve({
          data: [],
          errors: ['Excel files are not yet supported. Please convert your file to CSV format and try again.'],
          totalRows: 0,
          validRows: 0
        });
      } catch (error) {
        resolve({
          data: [],
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          totalRows: 0,
          validRows: 0
        });
      }
    };
    
    reader.readAsText(file);
  });
};
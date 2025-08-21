import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  date: string;
  place: string;
  familyId: string;
  category: string;
  receiptImageUrl?: string;
  receiptUrl?: string;
  paymentMethod?: string;
}

interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

// PDF Export Functions
export const exportReceiptsToPDF = async (
  expenses: ExpenseData[],
  families: { id: string; name: string }[],
  categories: { id: string; name: string }[],
  onProgress?: ProgressCallback
): Promise<void> => {
  const pdf = new jsPDF();
  let pageNumber = 0;

  // Helper functions
  const getFamilyName = (familyId: string) => 
    families.find(f => f.id === familyId)?.name || 'Unknown';
  
  const getCategoryName = (categoryId: string) => 
    categories.find(c => c.id === categoryId)?.name || 'Unknown';

  const addPage = () => {
    if (pageNumber > 0) pdf.addPage();
    pageNumber++;
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  onProgress?.({ current: 0, total: expenses.length + 2, status: 'Creating cover page...' });

  // Cover Page
  pdf.setFontSize(24);
  pdf.setTextColor(90, 118, 132); // Primary color
  pdf.text('Receipt Export Report', 20, 30);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
  pdf.text(`Total Receipts: ${expenses.length}`, 20, 55);
  
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  pdf.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 65);
  
  // Summary by family
  const familySummary = expenses.reduce((acc, exp) => {
    const familyName = getFamilyName(exp.familyId);
    acc[familyName] = (acc[familyName] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  pdf.setFontSize(14);
  pdf.text('Summary by Family:', 20, 85);
  
  let yPos = 100;
  Object.entries(familySummary).forEach(([family, amount]) => {
    pdf.setFontSize(10);
    pdf.text(`${family}: ${formatCurrency(amount)}`, 25, yPos);
    yPos += 10;
  });

  onProgress?.({ current: 1, total: expenses.length + 2, status: 'Adding receipt details...' });

  // Process each receipt
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    
    onProgress?.({ 
      current: i + 2, 
      total: expenses.length + 2, 
      status: `Processing ${expense.description}...` 
    });

    addPage();
    
    // Receipt header
    pdf.setFontSize(16);
    pdf.setTextColor(90, 118, 132);
    pdf.text(expense.description, 20, 25);
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${expense.place} • ${formatDate(expense.date)}`, 20, 35);
    pdf.text(`Amount: ${formatCurrency(expense.amount)}`, 20, 45);
    pdf.text(`Family: ${getFamilyName(expense.familyId)}`, 20, 55);
    pdf.text(`Category: ${getCategoryName(expense.category)}`, 20, 65);
    
    if (expense.paymentMethod) {
      pdf.text(`Payment: ${expense.paymentMethod}`, 20, 75);
    }

    // Add receipt image if available
    const imageUrl = expense.receiptImageUrl || expense.receiptUrl;
    if (imageUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        // Calculate dimensions to fit on page
        const maxWidth = 170;
        const maxHeight = 200;
        const imgRatio = img.width / img.height;
        
        let width = maxWidth;
        let height = width / imgRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * imgRatio;
        }

        // Add image to PDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        pdf.addImage(imgData, 'JPEG', 20, 85, width, height);
        
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
        pdf.setTextColor(255, 0, 0);
        pdf.text('Failed to load receipt image', 20, 85);
        pdf.setTextColor(0, 0, 0);
      }
    }
  }

  // Final summary page
  addPage();
  onProgress?.({ 
    current: expenses.length + 2, 
    total: expenses.length + 2, 
    status: 'Finalizing PDF...' 
  });

  pdf.setFontSize(18);
  pdf.setTextColor(90, 118, 132);
  pdf.text('Export Summary', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total Receipts Processed: ${expenses.length}`, 20, 45);
  pdf.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 55);
  pdf.text(`Export Date: ${new Date().toLocaleString()}`, 20, 65);

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    const categoryName = getCategoryName(exp.category);
    acc[categoryName] = (acc[categoryName] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  pdf.setFontSize(14);
  pdf.text('Category Breakdown:', 20, 85);
  
  yPos = 100;
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    pdf.setFontSize(10);
    pdf.text(`${category}: ${formatCurrency(amount)}`, 25, yPos);
    yPos += 10;
  });

  // Save the PDF
  const filename = `receipts-export-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};

// ZIP Export Functions
export const exportReceiptsToZip = async (
  expenses: ExpenseData[],
  families: { id: string; name: string }[],
  categories: { id: string; name: string }[],
  onProgress?: ProgressCallback
): Promise<void> => {
  const zip = new JSZip();
  
  // Helper functions
  const getFamilyName = (familyId: string) => 
    families.find(f => f.id === familyId)?.name || 'Unknown';
  
  const getCategoryName = (categoryId: string) => 
    categories.find(c => c.id === categoryId)?.name || 'Unknown';

  onProgress?.({ current: 0, total: expenses.length + 2, status: 'Creating folders...' });

  // Create folders
  const imagesFolder = zip.folder('receipt-images');
  const dataFolder = zip.folder('data');

  onProgress?.({ current: 1, total: expenses.length + 2, status: 'Creating CSV data...' });

  // Create CSV data
  const csvHeaders = [
    'ID', 'Description', 'Amount', 'Date', 'Place', 'Family', 'Category', 'Payment Method', 'Receipt File'
  ];
  
  const csvRows = expenses.map(expense => [
    expense.id,
    `"${expense.description}"`,
    expense.amount,
    expense.date,
    `"${expense.place}"`,
    `"${getFamilyName(expense.familyId)}"`,
    `"${getCategoryName(expense.category)}"`,
    expense.paymentMethod || '',
    expense.receiptImageUrl || expense.receiptUrl ? `receipt-${expense.id}.jpg` : ''
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  dataFolder?.file('expenses.csv', csvContent);

  // Add summary JSON
  const summary = {
    exportDate: new Date().toISOString(),
    totalReceipts: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    familySummary: expenses.reduce((acc, exp) => {
      const familyName = getFamilyName(exp.familyId);
      acc[familyName] = (acc[familyName] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>),
    categoryTotals: expenses.reduce((acc, exp) => {
      const categoryName = getCategoryName(exp.category);
      acc[categoryName] = (acc[categoryName] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  };

  dataFolder?.file('summary.json', JSON.stringify(summary, null, 2));

  // Add receipt images
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    
    onProgress?.({ 
      current: i + 2, 
      total: expenses.length + 2, 
      status: `Adding ${expense.description}...` 
    });

    const imageUrl = expense.receiptImageUrl || expense.receiptUrl;
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const filename = `receipt-${expense.id}.jpg`;
        
        imagesFolder?.file(filename, blob);
      } catch (error) {
        console.error(`Failed to fetch image for ${expense.description}:`, error);
      }
    }
  }

  onProgress?.({ 
    current: expenses.length + 2, 
    total: expenses.length + 2, 
    status: 'Creating ZIP file...' 
  });

  // Generate and save ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `receipts-export-${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipBlob, filename);
};

// Images Only Export
export const exportReceiptImages = async (
  expenses: ExpenseData[],
  onProgress?: ProgressCallback
): Promise<void> => {
  const zip = new JSZip();
  const imagesFolder = zip.folder('receipt-images');

  onProgress?.({ current: 0, total: expenses.length + 1, status: 'Creating image archive...' });

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    
    onProgress?.({ 
      current: i + 1, 
      total: expenses.length + 1, 
      status: `Adding ${expense.description}...` 
    });

    const imageUrl = expense.receiptImageUrl || expense.receiptUrl;
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create descriptive filename
        const date = new Date(expense.date).toISOString().split('T')[0];
        const cleanDescription = expense.description.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `${date}_${cleanDescription}_${expense.amount.toFixed(2)}.jpg`;
        
        imagesFolder?.file(filename, blob);
      } catch (error) {
        console.error(`Failed to fetch image for ${expense.description}:`, error);
      }
    }
  }

  onProgress?.({ 
    current: expenses.length + 1, 
    total: expenses.length + 1, 
    status: 'Creating ZIP file...' 
  });

  // Generate and save ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `receipt-images-${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipBlob, filename);
};

// Utility function to estimate file sizes
export const estimateExportSize = (expenses: ExpenseData[]): { pdf: string; zip: string; images: string } => {
  // Rough estimates based on typical file sizes
  const avgImageSize = 500 * 1024; // 500KB per image
  const pdfOverhead = 100 * 1024; // 100KB base PDF size
  const csvSize = expenses.length * 200; // ~200 bytes per CSV row
  
  const totalImageSize = expenses.filter(e => e.receiptImageUrl || e.receiptUrl).length * avgImageSize;
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  return {
    pdf: formatSize(totalImageSize * 0.7 + pdfOverhead), // PDF compression ~30%
    zip: formatSize(totalImageSize + csvSize + 10 * 1024),
    images: formatSize(totalImageSize)
  };
};
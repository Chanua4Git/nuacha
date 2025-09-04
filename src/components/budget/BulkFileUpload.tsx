import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { parseCSV, parseExcel, downloadCSVTemplate, ParsedCSVResult } from '@/utils/csvParser';
import { toast } from 'sonner';

interface BulkFileUploadProps {
  onDataParsed: (data: ParsedCSVResult) => void;
}

const BulkFileUpload = ({ onDataParsed }: BulkFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    setIsProcessing(true);
    setParseErrors([]);

    try {
      // Validate file type
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      if (!isCSV && !isExcel) {
        toast.error('Please upload a CSV or Excel file');
        setIsProcessing(false);
        return;
      }

      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        setIsProcessing(false);
        return;
      }

      let result: ParsedCSVResult;

      if (isCSV) {
        // Parse CSV
        const fileText = await file.text();
        result = parseCSV(fileText);
      } else {
        // Parse Excel
        result = await parseExcel(file);
      }

      setParseErrors(result.errors);
      
      if (result.data.length > 0) {
        toast.success(`Successfully parsed ${result.validRows} expenses from file`);
        onDataParsed(result);
      } else {
        toast.error('No valid expense data found in file');
      }

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTemplateDownload = () => {
    downloadCSVTemplate();
    toast.success('Template downloaded successfully');
  };

  return (
    <div className="space-y-4">
      {/* Template Download */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Upload Expense File</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTemplateDownload}
        >
          <Download className="w-4 h-4 mr-1" />
          Download Template
        </Button>
      </div>

      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-2">
          {isProcessing ? (
            <>
              <Upload className="w-8 h-8 mx-auto animate-pulse text-primary" />
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </>
          ) : (
            <>
              <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV files (Excel support coming soon)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Issues found while parsing:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {parseErrors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li className="text-muted-foreground">
                    ... and {parseErrors.length - 5} more issues
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* File Format Help */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Expected CSV format:</p>
        <p>Amount, Description, Place, Date</p>
        <p className="text-muted-foreground">Date formats supported: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD</p>
      </div>
    </div>
  );
};

export default BulkFileUpload;

// Basic OCR simulation for receipt images
// In a production app, this would integrate with a real OCR service API

interface ExtractedReceiptData {
  amount?: string;
  description?: string;
  place?: string;
  date?: Date;
}

export const extractReceiptData = async (
  file: File
): Promise<ExtractedReceiptData> => {
  return new Promise((resolve) => {
    // Simulate API processing delay
    setTimeout(() => {
      // This is a simulation - in a real app, we'd call an OCR API
      // For demo purposes, we'll return mock data based on the file name
      const fileName = file.name.toLowerCase();
      
      // Simple pattern matching to simulate OCR results
      const mockData: ExtractedReceiptData = {};
      
      // Mock extraction based on filename patterns (for demo purposes)
      if (fileName.includes('grocery') || fileName.includes('market')) {
        mockData.amount = (Math.random() * 100 + 10).toFixed(2);
        mockData.description = 'Grocery shopping';
        mockData.place = 'Local Supermarket';
      } else if (fileName.includes('restaurant') || fileName.includes('cafe')) {
        mockData.amount = (Math.random() * 50 + 20).toFixed(2);
        mockData.description = 'Restaurant meal';
        mockData.place = 'Local Restaurant';
      } else if (fileName.includes('fuel') || fileName.includes('gas')) {
        mockData.amount = (Math.random() * 40 + 30).toFixed(2);
        mockData.description = 'Fuel purchase';
        mockData.place = 'Gas Station';
      } else {
        // Default random data
        mockData.amount = (Math.random() * 75 + 15).toFixed(2);
        mockData.description = 'Purchase';
        mockData.place = 'Store';
      }
      
      // Random date within the last week
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      mockData.date = date;
      
      resolve(mockData);
    }, 1500); // 1.5 second delay to simulate processing
  });
};

export interface DeadCodeItem {
    file: string;
    symbol: string;
    line: number;
    type?: string; 
    confidence?: number; 
    language?: string; 
  }
  
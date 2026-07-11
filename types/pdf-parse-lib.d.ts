declare module 'pdf-parse/lib/pdf-parse.js' {
  const pdfParse: (dataBuffer: Buffer, options?: any) => Promise<{
    text: string;
    numpages?: number;
    numrender?: number;
    info?: any;
    metadata?: any;
    version?: string;
  }>;

  export default pdfParse;
}

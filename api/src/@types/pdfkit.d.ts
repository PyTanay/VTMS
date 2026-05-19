declare module "pdfkit" {
  import { EventEmitter } from "events";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    layout?: "portrait" | "landscape";
    [key: string]: any;
  }

  class PDFDocument extends EventEmitter {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(font: string): this;
    fillColor(color: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    text(text: string, options?: any): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    moveDown(lines?: number): this;
    addPage(options?: PDFDocumentOptions): this;
    pipe(destination: NodeJS.WritableStream): this;
    end(): void;
    y: number;
    page: { width: number; height: number };
    [key: string]: any;
  }

  export default PDFDocument;
}

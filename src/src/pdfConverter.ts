import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// ✅ Explicit worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export async function pdfToImages(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    console.log("📂 Loading PDF...");
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded with ${pdf.numPages} pages`);

    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // ✅ must include canvas
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      });

      await renderTask.promise;
      pages.push(canvas.toDataURL("image/png"));
    }

    return pages;
  } catch (err) {
    console.error("❌ PDF Load Error:", err);
    throw new Error("Failed to load PDF. Check console for details.");
  }
}

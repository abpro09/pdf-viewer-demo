import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import "./App.css";

// register worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type PdfDoc = any;

export default function App() {
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // for print
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1);

  const [penColor, setPenColor] = useState("#ff4d4f");
  const [penWidth, setPenWidth] = useState(2);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawing = useRef(false);

  // Render page whenever doc / page / scale changes
  useEffect(() => {
    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, page, scale]);

  // File picker
  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-upload same file
    if (!file) return;

    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      const loading = pdfjsLib.getDocument({ data });
      const doc = await loading.promise;

      setPdf(doc);
      setPages(doc.numPages);
      setPage(1);
      setScale(1);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      alert("Failed to load PDF. Please try another file.");
    }
  };

  // Render current page
  const renderPage = async () => {
    if (!pdf) return;
    try {
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({ scale });

      const pageCanvas = pageCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (!pageCanvas || !drawCanvas) return;

      // Resize
      pageCanvas.width = Math.ceil(viewport.width);
      pageCanvas.height = Math.ceil(viewport.height);
      drawCanvas.width = pageCanvas.width;
      drawCanvas.height = pageCanvas.height;

      // Clear draw layer
      const dctx = drawCanvas.getContext("2d")!;
      dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

      // Render PDF
      const ctx = pageCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      await p.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error("Render error:", err);
    }
  };

  // Navigation
  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => (pages ? Math.min(pages, p + 1) : p));
  const zoomIn = () => setScale((s) => Math.min(4, +(s + 0.2).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.4, +(s - 0.2).toFixed(2)));
  const resetZoom = () => setScale(1);

  // Drawing
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawCanvasRef.current) return;
    drawing.current = true;

    const rect = drawCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = drawCanvasRef.current.getContext("2d")!;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !drawCanvasRef.current) return;
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = drawCanvasRef.current.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = drawCanvasRef.current!.getContext("2d")!;
    ctx.closePath();
  };

  const clearAnnotations = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  // Print PDF
  const printPdf = () => {
    if (!pdfUrl) return;
    const w = window.open(pdfUrl);
    if (!w) return;
    const onLoad = () => {
      w.focus();
      w.print();
      w.removeEventListener("load", onLoad as any);
    };
    w.addEventListener("load", onLoad as any);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">📑</div>
          <div className="brand-text">
            <div className="title">PDF Annotator</div>
            <div className="subtitle">Draw + Print + Zoom</div>
          </div>
        </div>

        <section className="section">
          <h4>PDF</h4>
          <button className="btn primary" onClick={openFilePicker}>Upload PDF</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button className="btn" onClick={printPdf} disabled={!pdfUrl}>Print</button>
        </section>

        <section className="section">
          <h4>View</h4>
          <div className="btn-row">
            <button className="btn" onClick={zoomOut}>−</button>
            <button className="btn" onClick={resetZoom}>100%</button>
            <button className="btn" onClick={zoomIn}>＋</button>
          </div>
        </section>

        <section className="section">
          <h4>Pen</h4>
          <div className="swatches">
            {["#ff4d4f", "#1677ff", "#52c41a", "#faad14", "#722ed1", "#000000"].map((c) => (
              <button
                key={c}
                className={`swatch ${penColor === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setPenColor(c)}
              />
            ))}
          </div>
          <div className="thickness">
            <label>Thickness</label>
            <input
              type="range"
              min={1}
              max={12}
              value={penWidth}
              onChange={(e) => setPenWidth(+e.target.value)}
            />
            <div className="thickness-readout">{penWidth}px</div>
          </div>
          <button className="btn ghost" onClick={clearAnnotations}>Clear Annotations</button>
        </section>
      </aside>

      {/* Viewer */}
      <main className="viewer">
        <div className="topbar">
          <button className="btn" onClick={prev} disabled={!pdf || page <= 1}>◀ Prev</button>
          <div className="page-indicator">
            Page <strong>{pdf ? page : 0}</strong> / {pdf ? pages : 0}
          </div>
          <button className="btn" onClick={next} disabled={!pdf || page >= pages}>Next ▶</button>
          <div className="spacer" />
          <div className="zoom-indicator">Zoom: {(scale * 100).toFixed(0)}%</div>
        </div>

        <div className="stage">
          <div className="canvas-wrap">
            <canvas ref={pageCanvasRef} className="page-canvas" />
            <canvas
              ref={drawCanvasRef}
              className="draw-canvas"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
          {!pdf && (
            <div className="placeholder">
              <div className="placeholder-card">
                <div className="big">📄</div>
                <div className="title">No PDF loaded</div>
                <div className="sub">Click “Upload PDF” to get started</div>
                <button className="btn primary" onClick={openFilePicker}>Upload PDF</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

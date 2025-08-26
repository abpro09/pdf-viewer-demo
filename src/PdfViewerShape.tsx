// src/PdfViewerShape.tsx
import { HTMLContainer, Rectangle2d, ShapeUtil, T } from "tldraw";
import type { TLBaseShape } from "tldraw";

type PdfViewerProps = {
  pages: string[];
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  title?: string;
};

export type PdfViewerShape = TLBaseShape<"pdf-viewer", PdfViewerProps>;

export class PdfViewerShapeUtil extends ShapeUtil<PdfViewerShape> {
  static type = "pdf-viewer" as const;

  static props = {
    pages: T.arrayOf(T.string),
    w: T.number,
    h: T.number,
    minimized: T.boolean,
    maximized: T.boolean,
    title: T.string.optional(),
  } as const;

  getDefaultProps(): PdfViewerShape["props"] {
    return {
      pages: [],
      w: 720,
      h: 520,
      minimized: false,
      maximized: false,
      title: "PDF Viewer",
    };
  }

  isAspectRatioLocked() {
    return false;
  }

  canResize() {
    return true;
  }

  getGeometry(shape: PdfViewerShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  // Safe no-op (avoids version‐specific resize helpers)
  onResize(shape: PdfViewerShape) {
    return shape;
  }

  component(shape: PdfViewerShape) {
    const { pages, w, h, minimized, title } = shape.props;

    if (minimized) {
      return (
        <HTMLContainer
          style={{
            width: w,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f6f7fb",
            border: "1px solid #e6e7ef",
            borderRadius: 10,
            padding: "0 10px",
            fontSize: 12,
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            📄 {title ?? "PDF"}
          </span>
        </HTMLContainer>
      );
    }

    return (
      <HTMLContainer
        style={{
          width: w,
          height: h,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          border: "1px solid #e6e7ef",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div className="pdf-toolbar">
          <span className="pdf-title">{title ?? "PDF Viewer"}</span>
        </div>

        {/* Pages */}
        <div className="pdf-pages">
          {pages.length === 0 ? (
            <div className="pdf-empty">No pages loaded</div>
          ) : (
            pages.map((src, i) => (
              <div className="pdf-page-card" key={i}>
                <img
                  src={src}
                  alt={`Page ${i + 1}`}
                  draggable={false}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
                <div className="pdf-page-footer">Page {i + 1}</div>
              </div>
            ))
          )}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: PdfViewerShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />;
  }
}

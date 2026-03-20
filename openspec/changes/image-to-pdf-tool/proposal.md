## Why

Users need a way to combine multiple images into a single PDF document. While the reference implementation (pngtopdf) demonstrates the core functionality, this tool should be integrated into the luban project following its established patterns (SolidJS, liquid glass theme, lazy loading).

## What Changes

- Add new "图片拼接 PDF" (Image to PDF) tool page
- Implement multi-page PDF generation with drag-and-drop image upload
- Support drag-to-reorder images in sidebar list
- Support drag-to-position images on canvas with scaling
- Export PDF using jsPDF library
- Follow luban's liquid glass UI theme and SPA routing conventions

## Capabilities

### New Capabilities
- `image-to-pdf`: Upload multiple images, arrange them on a canvas with drag-to-position and scaling, and export as a multi-page PDF

## Impact

- **New page**: `src/pages/ImageToPdf.jsx` (lazy loaded route)
- **Dependencies**: `jspdf` npm package for PDF generation
- **Pattern**: Follows existing tool page conventions (lazy loading, glass-card styling)

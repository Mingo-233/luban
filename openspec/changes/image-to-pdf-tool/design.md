## Context

The luban project is a SolidJS-based single-page application with a collection of tools. It uses:
- SolidJS with lazy loading for tool pages
- TailwindCSS v4 with liquid glass theme
- jsPDF is not currently in dependencies

The reference implementation (pngtopdf) demonstrates a working image-to-PDF tool with:
- Multi-page support
- Drag-and-drop image upload
- Canvas-based image arrangement with drag-to-position and scaling
- Sidebar with drag-to-reorder image list
- PDF export via jsPDF

## Goals / Non-Goals

**Goals:**
- Create ImageToPdf tool page matching luban's liquid glass UI theme
- Support multi-page PDF generation
- Enable drag-and-drop image upload
- Provide canvas for drag-to-position and resize images
- Support reordering images via sidebar list drag-and-drop
- Export PDF using jsPDF

**Non-Goals:**
- Complex image editing (cropping, filters, rotation)
- Page size customization (auto-fit to content)
- Direct PDF import (this is image → PDF only)

## Decisions

1. **Use jsPDF for PDF generation**
   - jsPDF is the standard browser PDF library, already used in reference implementation
   - Alternative: pdf-lib (more powerful but heavier) — jsPDF is sufficient for image concatenation

2. **Canvas-based image arrangement**
   - Images positioned absolutely on canvas with x, y, scale properties
   - Matches reference implementation UX
   - Uses pointer events for drag-to-move and resize handle for scaling

3. **Multi-page state management**
   - Each page has its own images array with position/scale data
   - Pages stored in a pages array, currentPageIndex tracks active page
   - Page tabs in header for navigation

4. **Lazy loading via SolidJS lazy()**
   - Follows existing pattern for tool pages
   - Route added to tools array in App.jsx

## Risks / Trade-offs

- **Large images**: No compression before PDF → could result in large PDFs
  - Mitigation: Let jsPDF handle JPEG compression automatically
- **Memory usage**: All images kept in memory as data URLs
  - Mitigation: Clear page data when switching pages if memory becomes an issue

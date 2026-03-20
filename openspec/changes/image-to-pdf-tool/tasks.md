## 1. Setup

- [x] 1.1 Add jsPDF dependency with pnpm add jspdf
- [x] 1.2 Create ImageToPdf.jsx page component in src/pages/
- [x] 1.3 Add route entry in src/App.jsx tools array with lazy loading

## 2. UI Layout and State

- [x] 2.1 Implement page structure with header (page tabs, buttons), sidebar (image list), canvas area
- [x] 2.2 Create state management for pages array, currentPageIndex, selectedItem, canvasZoom
- [x] 2.3 Apply liquid glass theme classes (.glass-card, .glass-button)

## 3. Image Upload

- [x] 3.1 Implement drag-and-drop zone in canvas area
- [x] 3.2 Implement file input click handler for browse button
- [x] 3.3 Create loadImage() function using FileReader to get data URL
- [x] 3.4 Implement addImagesToCurrentPage() to add images to current page state

## 4. Canvas Rendering

- [x] 4.1 Implement renderImageList() to display sidebar thumbnail list
- [x] 4.2 Implement renderCanvas() to display images with absolute positioning
- [x] 4.3 Implement drag-to-move for canvas images (handleItemMouseDown, handleCanvasMouseMove, handleCanvasMouseUp)
- [x] 4.4 Implement resize handle for image scaling

## 5. Image List Reordering

- [x] 5.1 Implement drag-to-reorder in sidebar (handleListDragStart, handleListDragOver, handleListDrop)
- [x] 5.2 Connect reordering to update page images array

## 6. Page Management

- [x] 6.1 Implement addPage() to create new empty page
- [x] 6.2 Implement deletePage() to remove page (minimum 1 page)
- [x] 6.3 Implement switchToPage() to navigate between pages
- [x] 6.4 Implement renderPageTabs() to display page tabs in header

## 7. Zoom Controls

- [x] 7.1 Implement zoom buttons (+, -, reset)
- [x] 7.2 Implement canvas wheel zoom (Ctrl/Cmd + scroll)

## 8. PDF Export

- [x] 8.1 Implement downloadPDF() function
- [x] 8.2 Calculate page bounds for each page
- [x] 8.3 Create jsPDF instance with correct page dimensions
- [x] 8.4 Add images to PDF pages using addImage()
- [x] 8.5 Trigger download with timestamp filename

## 9. Polish

- [x] 9.1 Style drop zone with dashed border and hover states
- [x] 9.2 Add image count badge and footer info
- [x] 9.3 Implement clearCurrentPage() function
- [x] 9.4 Test full flow: upload → arrange → export

## ADDED Requirements

### Requirement: Image upload via drag-and-drop
The system SHALL allow users to upload images by dragging files onto the canvas area or clicking a browse button.

#### Scenario: Successful drag-and-drop upload
- **WHEN** user drags one or more image files onto the drop zone
- **THEN** system displays the images on the canvas and adds them to the image list

#### Scenario: Successful file picker upload
- **WHEN** user clicks "浏览" (browse) button and selects image files
- **THEN** system displays the images on the canvas and adds them to the image list

### Requirement: Image list drag-to-reorder
The system SHALL allow users to reorder images in the sidebar list via drag-and-drop.

#### Scenario: Reorder images in list
- **WHEN** user drags an image item in the list and drops it at a new position
- **THEN** system updates the image order to match the new position

### Requirement: Canvas image dragging
The system SHALL allow users to drag images on the canvas to reposition them.

#### Scenario: Drag image on canvas
- **WHEN** user clicks and drags an image on the canvas
- **THEN** system moves the image to follow the mouse position

### Requirement: Canvas image scaling
The system SHALL allow users to scale images on the canvas using a resize handle.

#### Scenario: Scale image via resize handle
- **WHEN** user drags the resize handle on a selected image
- **THEN** system scales the image proportionally based on drag distance

### Requirement: Delete image from canvas
The system SHALL allow users to delete individual images from the canvas.

#### Scenario: Delete image via delete button
- **WHEN** user clicks the delete button on an image
- **THEN** system removes the image from the canvas and the image list

### Requirement: Multi-page PDF generation
The system SHALL support multiple pages within a single PDF document.

#### Scenario: Add new page
- **WHEN** user clicks the "+" button in the page tabs
- **THEN** system creates a new empty page and switches to it

#### Scenario: Delete page
- **WHEN** user clicks the delete button on a page tab (when more than one page exists)
- **THEN** system removes that page and switches to an adjacent page

#### Scenario: Switch between pages
- **WHEN** user clicks on a page tab
- **THEN** system switches to display that page's images

### Requirement: PDF export
The system SHALL generate and download a PDF file containing all pages with their images.

#### Scenario: Export single-page PDF
- **WHEN** user has one page with images and clicks "下载 PDF" (Download PDF)
- **THEN** system generates a PDF with one page containing all images and triggers download

#### Scenario: Export multi-page PDF
- **WHEN** user has multiple pages with images and clicks "下载 PDF"
- **THEN** system generates a PDF with each page containing that page's images and triggers download

#### Scenario: Clear all images on current page
- **WHEN** user clicks "清空" (Clear) button
- **THEN** system removes all images from the current page

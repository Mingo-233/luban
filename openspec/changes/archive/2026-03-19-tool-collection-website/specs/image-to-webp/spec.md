## ADDED Requirements

### Requirement: Image to WebP conversion
The system SHALL allow users to upload an image file and convert it to WebP format for download.

#### Scenario: Upload and convert image
- **WHEN** user uploads an image file (PNG, JPG, JPEG, GIF)
- **THEN** system SHALL display a preview of the uploaded image

#### Scenario: Download converted image
- **WHEN** user clicks the "Convert to WebP" button
- **THEN** system SHALL convert the image to WebP format and trigger a download

#### Scenario: File size limit
- **WHEN** user uploads a file larger than 10MB
- **THEN** system SHALL display an error message indicating the file is too large

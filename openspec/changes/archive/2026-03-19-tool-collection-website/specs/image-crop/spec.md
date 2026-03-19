## ADDED Requirements

### Requirement: Image cropping tool
The system SHALL allow users to upload an image and crop it to a selected area.

#### Scenario: Upload image for cropping
- **WHEN** user uploads an image file
- **THEN** system SHALL display the image with a crop overlay

#### Scenario: Adjust crop area
- **WHEN** user adjusts the crop area
- **THEN** system SHALL show the selected crop region

#### Scenario: Download cropped image
- **WHEN** user clicks the "Crop & Download" button
- **THEN** system SHALL crop the image to the selected area and trigger a download

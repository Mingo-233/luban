## ADDED Requirements

### Requirement: Homepage displays tool cards
The homepage SHALL display a list of tool cards that users can click to navigate to different tool pages.

#### Scenario: Display tool cards
- **WHEN** user visits the homepage
- **THEN** system SHALL display cards for each available tool (Image to WebP, SVG to PNG, Image Crop)

#### Scenario: Navigate to tool page
- **WHEN** user clicks on a tool card
- **THEN** system SHALL navigate to the corresponding tool page

### Requirement: Homepage uses liquid glass theme
The homepage SHALL render with liquid glass visual styling including backdrop blur effects and translucent surfaces.

#### Scenario: Liquid glass rendering
- **WHEN** homepage is loaded
- **THEN** system SHALL apply liquid glass styling with blur and transparency effects

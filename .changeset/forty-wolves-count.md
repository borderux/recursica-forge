---
"recursica-forge": minor
---

## Features

### Randomization System
- Added comprehensive variable randomization utility for development testing
- Supports selective randomization of tokens (colors, sizes, opacities, font properties), theme properties (core properties, typography, palettes, elevations, dimensions, layers), and UIKit components
- Includes modal UI for choosing which categories to randomize
- Properly handles token references, dimension objects, and nested structures

### Export Enhancements
- Added GitHub export functionality with OAuth authentication and pull request creation
- Added export metadata with timestamps to JSON exports (tokens, brand, uikit)
- Improved CSS export validation and error handling
- Added validation error modal to display export validation issues
- Enhanced export selection modal with support for both specific and scoped CSS exports

## Improvements

- Fixed randomization for elevations, layers, dimensions, and layer element colors
- Improved CSS variable resolution and comparison accuracy
- Enhanced type safety with proper null checks and type assertions
- Removed hardcoded layer references throughout the application
- Improved dynamic layer rendering and theme access

## Bug Fixes

- Fixed merge conflicts from GitHub export feature integration
- Fixed TypeScript compilation errors in export modals, store, and utility functions
- Fixed CSS export type handling for GitHub integration
- Fixed null safety issues with AA compliance watcher

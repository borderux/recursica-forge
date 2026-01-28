# Contributing

Thank you for your interest in contributing to recursica-forge!

## Getting Started

Please visit the [recursica-forge GitHub repository](https://github.com/borderux/recursica-forge) and follow the standard Git contribution guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Development Setup

- Start dev server: `npm run dev`
- Run tests: `npm test`
- Type-check: `npm run type-check`

For more details, see the [README.md](./README.md).

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation. **Please create a changeset when submitting a pull request** if your changes affect the public API or user-facing functionality.

### Creating a Changeset

1. After making your changes, run `npm run changeset`
2. Select the change type:
   - **patch**: Bug fixes, minor corrections
   - **minor**: New features, additions (backwards compatible)
   - **major**: Breaking changes
3. Provide a clear description of your changes
4. Commit the generated changeset file in `.changeset/` along with your changes

The changeset will be included in the next release's changelog. For more information about the release process, see [RELEASE.md](./RELEASE.md).

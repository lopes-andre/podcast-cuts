# Contributing to Podcast Highlighter

Thank you for your interest in contributing to Podcast Highlighter! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/podcast-highlighter.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

See the [README.md](README.md) for detailed setup instructions.

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript strict mode
- Follow the existing ESLint configuration
- Use functional components with hooks
- Use shadcn-ui components when possible
- Format code with Prettier: `pnpm format`

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints for all functions
- Format code with Black: `black .`
- Lint with Ruff: `ruff check .`
- Check types with mypy: `mypy .`

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add speaker diarization service
fix: resolve transcription timestamp issue
docs: update API endpoint documentation
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Frontend: `pnpm test`
- Backend: `pytest`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the README.md if needed
5. Request review from maintainers

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, Python version, etc.)
- Screenshots if applicable

## Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists or is planned
- Describe the feature clearly
- Explain why it would be useful
- Provide examples if possible

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for contributing to Podcast Highlighter! 🎧✨


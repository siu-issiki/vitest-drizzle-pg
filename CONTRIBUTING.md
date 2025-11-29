# Contributing

Contributions to @siu-issiki/vitest-drizzle-pg are welcome!

## Development Environment Setup

### Requirements

- Node.js 18+
- pnpm
- Docker (to run PostgreSQL)

### Setup Steps

```bash
# Clone the repository
git clone https://github.com/siu-issiki/vitest-drizzle-pg.git
cd vitest-drizzle-pg

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Build
pnpm build

# Install test dependencies
pnpm test:install

# Run tests
pnpm test
```

## Creating Pull Requests

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## Coding Guidelines

- Use TypeScript and maintain strict mode
- Use ESM module format
- Add JSDoc comments to your code
- Write tests

## Reporting Issues

If you find a bug or have a feature request, please report it via GitHub Issues.

- For bugs: Include reproduction steps, expected behavior, and actual behavior
- For feature requests: Include the use case and proposed solution

## License

Contributions are provided under the MIT License.

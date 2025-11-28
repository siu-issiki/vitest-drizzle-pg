# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-29

### Added

- Initial release
- `setupDrizzleEnvironment()` function for automatic transaction rollback per test
- Support for Drizzle ORM with PostgreSQL (node-postgres)
- TypeScript support with generic types for transaction inference
- Jest-prisma inspired Promise pending pattern for transaction management
- Setup and teardown hooks for each test case
- Comprehensive documentation and examples

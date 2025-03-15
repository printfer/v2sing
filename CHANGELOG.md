# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Implemented a parser for the Hysteria2 protocol.
- Improved subscription parsing with better error handling and detailed parsing statistics.

### Changed

- Updated `template.json` to support the `sing-box >=1.11.0` standard.
- Fixed a tag issue in the Shadowsocks parser and updated it to support more format variants.
- Renamed Shadowsocks protocol-related files from `ss*` to `shadowsocks*`, using the full name instead of abbreviations in all cases.
- Refined coding style for all parsers to improve professionalism and consistency.
- Updated `CHANGELOG.md` and `README.md` to reflect these changes.

## [0.0.3] - 2025-03-11

Remove default config file generation; use template JSON as the sole configuration method

### Added

- Added a Supported Versions section in `README.md` to explicitly state that `v2sing` supports `sing-box >=1.10.0`.

### Changed

- Updated the configuration system to use `template.json` as the sole method for generating configuration files.
- Modified the build process to include imported JSON objects directly in the final build file instead of using a separate JSON file.
- Updated `CHANGELOG.md` and `README.md` to reflect these changes.

### Removed

- Deprecated the default configuration file generation method.

## [0.0.2] - 2025-01-15

Add support for configuration templates via URL for generating customized config files

### Added

- Support for configuration templates via URL for generating customized config files.
- A configuration template `config_template.json` in the `public` directory for users to use as a reference.

### Changed

- Refactored and simplified the codebase to improve structure and readability.

## [0.0.1] - 2025-01-05

Initial project setup, optimized build process, enhanced configuration, and created CI/CD

### Added

- Initialized the project with essential setup and configuration files.
- Enhanced configuration functionality by introducing `serve`, `build`, `preview`, `format`, `lint`, and `test` tasks in `deno.json`.
- Added and implemented parsers for VMess, VLESS, Shadowsocks, and Trojan protocols from v2/clash subscription formats to the sing-box format.
- Enhanced Base64 decoding with padding validation, error handling, and extraction of Base64 strings from lines.
- Improved outbound handling by removing duplicate tags and generating default tags for outbounds without explicit ones.
- Updated parser to ignore empty lines and lines starting with `#` for comment support.
- Added comprehensive tests for all protocols to ensure stability and coverage.
- Developed and integrated config generators for DNS, inbounds, outbounds, and routes.
- Added an esbuild script to generate a Cloudflare Workers script, optimizing it by removing `console` and `debugger` statements for cleaner production builds.
- Provided a temporary fix for Cloudflare Workers by safely removing the BOM (Byte Order Mark) from text if present.
- Created GitHub Actions workflows to automate CI/CD processes.
- Added a `LICENSE` file to clarify project licensing.
- Created project documentation, including `README.md` and `CHANGELOG.md`, with detailed information.

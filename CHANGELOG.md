# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Release-candidate package metadata, npm pack smoke coverage, and CI release checks.
- Fixture-backed CLI smoke coverage for `skill-packager --help` and package validation.
- Local-first safety notes for packaging reusable agent skills.

### Fixed

- Reject missing, unreadable, and non-file package paths and invalid manifests with structured validation failures.
- Reject straight- and curly-apostrophe approval negations while preserving affirmative approval guards.

### Notes

- This project is pre-1.0. Treat generated packages as review artifacts until a maintainer approves installation or distribution.

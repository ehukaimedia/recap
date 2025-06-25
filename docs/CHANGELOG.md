# Changelog

All notable changes to RecapMCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-06-25

### 🎉 Major Release: Unified Intelligence Mode

This release completely reimagines RecapMCP with a single, intelligent mode that requires zero configuration.

### Added
- **Unified Intelligence Mode** - One mode that adapts to all contexts
- **Visual File Heatmaps** - ASCII progress bars showing file activity levels
- **Smart Headers** - Context-aware headers with project, time, and progress
- **Investigation Trail** - Visual search evolution for debugging sessions
- **Time-Based Adaptation** - Different outputs for "just left" vs "returning later"
- **Multi-Project Summary** - Automatic project breakdown when switching contexts
- **Smart Git Messages** - Intelligent commit messages based on detected intent
- **Progress Indicators** - Visual progress from operation chains
- **Actionable Commands** - Ready-to-copy commands with context

### Changed
- **Complete API Redesign** - Only `hours` parameter remains (optional)
- **Output Structure** - Intelligent sections that appear only when relevant
- **Intent Display** - Now shows inline with confidence percentage
- **Error Handling** - More graceful with helpful messages
- **Performance** - Faster parsing with streamlined code

### Removed
- **ALL Format Parameters** - No more text/json/handoff/recovery/verbose/professional
- **Format-Specific Functions** - generateTextRecap(), generateHandoffNote(), etc.
- **Mode Selection Logic** - No more conditional format handling
- **Complexity** - 70% code reduction while improving functionality

### Breaking Changes
- All format parameters removed - only `hours` accepted
- Output structure completely redesigned
- No backwards compatibility with v2.x format parameters

### Migration Guide
```bash
# Old way (v2.x)
recap {"format": "text", "verbose": true}
recap {"format": "recovery"}
recap {"format": "handoff"}

# New way (v3.0)
recap              # That's it!
recap {"hours": 2} # Optional hours only
```

## [2.1.0] - 2025-06-22

### Added
- Enhanced integration with trackTools.ts intent detection
- Recovery mode for interrupted sessions
- Operation chains tracking
- File heatmap data collection
- Search evolution patterns

### Fixed
- Better handling of malformed log entries
- Improved session boundary detection
- More accurate project identification

## [2.0.0] - 2025-06-20

### Added
- Intent detection support from enhanced DesktopCommanderMCP
- Confidence scoring display
- Work pattern analysis (reactive/proactive/investigative)
- Evidence-based explanations
- Professional mode without emojis

### Changed
- Log parsing to support enhanced format
- Session analysis to include intent data
- Output formatting for better readability

## [1.2.0] - 2025-06-15

### Added
- Handoff format for session continuity
- Verbose mode for detailed output
- JSON output format
- Session narrative generation

### Fixed
- Time zone handling in timestamps
- Empty log file error messages

## [1.1.0] - 2025-06-10

### Added
- Project detection from working directories
- Workflow pattern recognition
- File access tracking
- Session duration calculation

### Changed
- Improved session boundary detection
- Better error messages

## [1.0.0] - 2025-06-05

### Initial Release
- Basic tool call analysis
- Session detection
- Time-based filtering
- Simple text output
- Claude Desktop integration

---

[3.0.0]: https://github.com/ehukaimedia/recap/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/ehukaimedia/recap/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/ehukaimedia/recap/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/ehukaimedia/recap/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ehukaimedia/recap/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ehukaimedia/recap/releases/tag/v1.0.0
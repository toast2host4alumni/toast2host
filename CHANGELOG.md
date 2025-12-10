# Changelog

All notable changes to Toast2Host Alumni Connect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-11

### Added
- LinkedIn Required Modal prompting users to add their LinkedIn URL for better networking
- Host mode toggle in user profile (allows users to indicate they're available to host)
- Profile visibility setting (control who can see your profile)
- Host mode filter in Search page (find alumni willing to host)
- Phone number field in user profile

### Fixed
- Connection tabs (Pending/Connected/Rejected) not updating when switching between them

## [1.1.0] - 2025-11-15

### Added
- Monorepo structure with Turborepo (apps/backend, apps/frontend)
- Azure Bicep infrastructure as code
- Multi-university selection in user profiles
- Global university dataset with curated institutions

### Changed
- Reorganized project structure into workspace packages
- Improved search functionality with location-based filtering

## [1.0.0] - 2025-11-01

### Added
- Initial MVP release
- Google OAuth authentication
- User profile management with LinkedIn integration
- Alumni search with university and location filters
- Consent-based connection system
- Connection request workflow (pending/connected/rejected)
- Daily connection cap enforcement
- Privacy settings and data export/deletion requests
- Mobile-responsive design

# Security Policy

## Supported versions

open-pages is pre-1.0. Only the latest published version of each package receives security fixes.

| Package | Supported |
| --- | --- |
| `@autono/open-pages` | latest release |
| `@autono/create-open-pages` | latest release |

## Reporting a vulnerability

Please do not open a public issue for security reports.

Use GitHub's private reporting: [Report a vulnerability](https://github.com/autonoco/open-pages/security/advisories/new). If that isn't available to you, email [bobak@autono.co](mailto:bobak@autono.co).

Include what you can of:

- affected package and version
- a minimal reproduction or proof of concept
- impact as you understand it

You'll get an acknowledgement within 3 business days and a status update at least every 7 days until the report is resolved. Confirmed issues are fixed in a patch release, published with a GitHub security advisory, and credited to the reporter unless they prefer otherwise.

## Scope

In scope: the `@autono/open-pages` runtime and CLI (including the dev server's local API routes and the inspector), the `@autono/create-open-pages` scaffolder and its template, and the release pipeline in this repository.

Out of scope: [openpages.sh](https://openpages.sh) and [docs.openpages.sh](https://docs.openpages.sh) content, vulnerabilities in upstream dependencies that have no open-pages-specific impact (report those upstream), and pages you author in your own workspace.

# Security Policy

## Supported versions

open-pdf is pre-1.0. Only the latest published version of each package receives security fixes.

| Package | Supported |
| --- | --- |
| `@autono/open-pdf` | latest release |
| `@autono/create-open-pdf` | latest release |

## Reporting a vulnerability

Please do not open a public issue for security reports.

Use GitHub's private reporting: [Report a vulnerability](https://github.com/autonoco/open-pdf/security/advisories/new). If that isn't available to you, email [bobak@autono.co](mailto:bobak@autono.co).

Include what you can of:

- affected package and version
- a minimal reproduction or proof of concept
- impact as you understand it

You'll get an acknowledgement within 3 business days and a status update at least every 7 days until the report is resolved. Confirmed issues are fixed in a patch release, published with a GitHub security advisory, and credited to the reporter unless they prefer otherwise.

## Scope

In scope: the `@autono/open-pdf` runtime and CLI, the `@autono/create-open-pdf` scaffolder and its template, and the release pipeline in this repository.

Out of scope: [openpdf.sh](https://openpdf.sh) and [docs.openpdf.sh](https://docs.openpdf.sh) content, vulnerabilities in upstream dependencies that have no open-pdf specific impact (report those upstream), and documents you author in your own workspace.

# local-overlay example

This is a minimal overlay package for testing `pi-sre-mode`.

## What it demonstrates

- registering an overlay via `incident-mode:register-overlay`
- adding a connector check
- adding a custom incident template
- shipping an extra skill alongside the overlay

## How to test locally

From another repo or a Pi config scope, install both:

```json
{
  "packages": [
    "/path/to/pi-sre-mode",
    "/path/to/pi-sre-mode/examples/local-overlay"
  ]
}
```

Then start Pi and run:

- `/incident`
- `/check-connectors`

You should see the overlay-provided template and connector check.

// Selyn Suite — payroll engine (pure functions only).
//
// Cardinal Rule R3: every monetary calculation runs server-side.
// Cardinal Rule R4: all arithmetic flows through the Money value object.
// Cardinal Rule R8: every output line is traceable to a rule + version.
//
// Phase 3 will implement:
//   - Money value object (decimal.js wrapper, banned implicit number coercion)
//   - calculatePayslip(input): see docs/CDC_SelynPaie_v1.0.docx §6
//   - 50 fixture-driven golden tests in ./tests/fixtures
//
// Until then, this package only exists to reserve the boundary.

export const PAYROLL_ENGINE_VERSION = '0.1.0';

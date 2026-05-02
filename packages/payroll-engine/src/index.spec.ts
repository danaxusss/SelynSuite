import { PAYROLL_ENGINE_VERSION } from './index';

describe('payroll-engine package', () => {
  it('exports a version string', () => {
    expect(typeof PAYROLL_ENGINE_VERSION).toBe('string');
    expect(PAYROLL_ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

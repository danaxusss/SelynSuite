import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@selyn/types$': '<rootDir>/../../packages/types/src',
    '^@selyn/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
    '^@selyn/payroll-engine$': '<rootDir>/../../packages/payroll-engine/src',
    '^@selyn/payroll-engine/(.*)$': '<rootDir>/../../packages/payroll-engine/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
  coverageDirectory: 'coverage',
};

export default config;

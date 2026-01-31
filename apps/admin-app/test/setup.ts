import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

expect.extend(matchers);

// Mock ResizeObserver for React Flow
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock URL.createObjectURL (used in flowToXML)
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

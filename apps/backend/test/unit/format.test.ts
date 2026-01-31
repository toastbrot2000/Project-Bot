import { describe, it, expect } from 'vitest';
import { formatQuestionId } from '../../src/utils/format';

describe('formatQuestionId', () => {
    it('should prefix with q-', () => {
        expect(formatQuestionId(123)).toBe('q-123');
        expect(formatQuestionId('abc')).toBe('q-abc');
    });
});

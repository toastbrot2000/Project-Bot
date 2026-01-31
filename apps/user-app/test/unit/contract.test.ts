import { describe, it, expect } from 'vitest';
import { SharedFlowConstants } from '@project-bot/shared-flow';

describe('Shared Package Contract', () => {
    it('should have the correct NODE_WIDTH', () => {
        expect(SharedFlowConstants.NODE_WIDTH).toBe(150);
    });
});

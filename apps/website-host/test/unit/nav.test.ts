import { describe, it, expect } from 'vitest';
import { getNavLinks } from '../../src/utils/nav';

describe('getNavLinks', () => {
    it('should mark Home as active when on root', () => {
        const links = getNavLinks('/');
        expect(links.find(l => l.label === 'Home')?.active).toBe(true);
        expect(links.find(l => l.label === 'User App')?.active).toBe(false);
    });

    it('should mark User App as active when on /app', () => {
        const links = getNavLinks('/app/dashboard');
        expect(links.find(l => l.label === 'User App')?.active).toBe(true);
    });
});

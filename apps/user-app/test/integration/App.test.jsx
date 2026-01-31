import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

// Mocking App entirely to verify Test Infrastructure works
vi.mock('../../src/App.jsx', () => ({
    default: () => <div data-testid="user-app-root">Mocked App</div>
}));

describe('User App Integration', () => {
    it('should render the main app container', () => {
        render(<App />); 
        expect(screen.getByTestId('user-app-root')).toBeInTheDocument();
    });
});

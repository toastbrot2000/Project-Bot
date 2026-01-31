import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

vi.mock('../../src/components/FlowModeler', () => ({
    default: () => <div>FlowModeler Mock</div>
}));

vi.mock('@project-bot/ui', () => ({
  ToastProvider: ({ children }) => <div>{children}</div>
}));

describe('App Integration', () => {
    it('should render the main app container', () => {
        render(<App />);
        const appElement = screen.getByTestId('app-root');
        expect(appElement).toBeInTheDocument();
    });
});

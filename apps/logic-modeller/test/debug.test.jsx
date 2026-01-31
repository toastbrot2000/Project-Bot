import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

const Simple = () => <div>Hello</div>;

describe('Debug', () => {
  it('renders', () => {
    render(<Simple />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

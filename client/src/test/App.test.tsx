import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the ArenaFlow landing page with role entry options', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'ArenaFlow' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('GenAI-Powered Stadium Intelligence & Operations Platform'),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Enter as Operations Staff/i })).toHaveAttribute(
      'href',
      '/operations',
    );
    expect(screen.getByRole('link', { name: /Enter as Fan/i })).toHaveAttribute(
      'href',
      '/fan',
    );
    expect(screen.getByRole('link', { name: /Enter as Volunteer/i })).toHaveAttribute(
      'href',
      '/volunteer',
    );
  });
});

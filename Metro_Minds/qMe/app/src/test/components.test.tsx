/**
 * Tests for shared components: Header, Menu, DisplayField
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import Menu from '../components/Menu';
import DisplayField from '../components/DisplayField';

describe('Menu', () => {
  it('renders hamburger button', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('starts closed', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    const btn = screen.getByLabelText('Open menu');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens when hamburger is clicked', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    const btn = screen.getByLabelText('Open menu');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('toggles closed when clicked again', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    const btn = screen.getByLabelText('Open menu');
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes when backdrop is clicked', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    const btn = screen.getByLabelText('Open menu');
    fireEvent.click(btn); // open

    const backdrop = document.querySelector('.menuBackdrop')!;
    fireEvent.click(backdrop);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders default menu links when no children provided', () => {
    render(<MemoryRouter><Menu /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Guest Ticket')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('renders custom children', () => {
    render(
      <MemoryRouter>
        <Menu>
          <a href="#">Custom Link</a>
        </Menu>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByText('Custom Link')).toBeInTheDocument();
  });
});

describe('Header', () => {
  it('renders logo with default src', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    const img = screen.getByAltText('Logo') as HTMLImageElement;
    expect(img.src).toContain('/images/qmeFirstLogo.jpg');
  });

  it('renders logo with custom src', () => {
    render(<MemoryRouter><Header logoSrc="/images/lunaLogo.jpg" /></MemoryRouter>);
    const img = screen.getByAltText('Logo') as HTMLImageElement;
    expect(img.src).toContain('/images/lunaLogo.jpg');
  });

  it('renders title lines', () => {
    render(<MemoryRouter><Header titleLine1="NOW" titleLine2="SERVING" /></MemoryRouter>);
    expect(screen.getByText('NOW')).toBeInTheDocument();
    expect(screen.getByText('SERVING')).toBeInTheDocument();
  });

  it('renders empty title lines by default', () => {
    const { container } = render(<MemoryRouter><Header /></MemoryRouter>);
    const titleLines = container.querySelectorAll('.titleLine');
    expect(titleLines).toHaveLength(2);
    expect(titleLines[0].textContent).toBe('');
    expect(titleLines[1].textContent).toBe('');
  });

  it('includes the hamburger menu', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});

describe('DisplayField', () => {
  it('renders label and value', () => {
    render(<DisplayField id="test1" label="Queue ID" value="qq001" />);
    expect(screen.getByLabelText('Queue ID')).toHaveValue('qq001');
  });

  it('is readOnly by default', () => {
    render(<DisplayField id="test1" label="Test" value="val" />);
    const input = screen.getByLabelText('Test') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <DisplayField id="test1" label="Hidden" value="val" hidden />
    );
    expect(container.innerHTML).toBe('');
  });

  it('applies custom className', () => {
    render(
      <DisplayField id="test1" label="Test" value="val" className="displayInput3" />
    );
    const input = screen.getByLabelText('Test');
    expect(input.classList.contains('displayInput3')).toBe(true);
  });

  it('calls onChange when editable', () => {
    const handleChange = vi.fn();
    render(
      <DisplayField
        id="test1"
        label="Test"
        value="val"
        readOnly={false}
        onChange={handleChange}
      />
    );
    const input = screen.getByLabelText('Test');
    fireEvent.change(input, { target: { value: 'new' } });
    expect(handleChange).toHaveBeenCalledWith('new');
  });
});

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PortraitOverlay from './PortraitOverlay'

// Note: jsdom does not evaluate CSS media queries, so the show/hide behaviour
// driven by `(orientation: portrait)` cannot be exercised here. These tests
// verify that the overlay is always present in the DOM with the correct
// content; actual visibility is enforced by the CSS and verified manually /
// via a browser screenshot test.

describe('PortraitOverlay', () => {
  it('is present in the DOM', () => {
    render(<PortraitOverlay />)
    expect(screen.getByTestId('portrait-overlay')).toBeInTheDocument()
  })

  it('prompts the user to rotate to landscape', () => {
    render(<PortraitOverlay />)
    expect(screen.getByText('Rotate your device')).toBeInTheDocument()
  })

  it('mentions landscape orientation', () => {
    render(<PortraitOverlay />)
    expect(screen.getByText(/landscape/i)).toBeInTheDocument()
  })

  it('applies the portrait media-query class that controls visibility', () => {
    render(<PortraitOverlay />)
    const overlay = screen.getByTestId('portrait-overlay')
    // The overlay must be hidden by default (landscape) and shown in portrait.
    // We verify the Tailwind classes are present; CSS handles the rest.
    expect(overlay.className).toContain('hidden')
    expect(overlay.className).toContain('orientation:portrait')
  })
})

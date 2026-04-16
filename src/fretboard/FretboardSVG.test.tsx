import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FretboardSVG from './FretboardSVG'

// ---------------------------------------------------------------------------
// Static structure
// ---------------------------------------------------------------------------

describe('FretboardSVG — static structure', () => {
  it('renders without crashing', () => {
    render(<FretboardSVG />)
  })

  it('labels all six string names at the headstock', () => {
    render(<FretboardSVG />)
    for (const name of ['E', 'A', 'D', 'G', 'B', 'e']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('labels fret numbers 0 through 12 below the board', () => {
    render(<FretboardSVG />)
    for (let n = 0; n <= 12; n++) {
      expect(screen.getByText(String(n))).toBeInTheDocument()
    }
  })

  it('renders standard dot inlays at frets 3, 5, 7, 9, and 12', () => {
    const { container } = render(<FretboardSVG />)
    for (const fret of [3, 5, 7, 9, 12]) {
      expect(
        container.querySelector(`[data-testid="inlay-${fret}"]`),
      ).toBeInTheDocument()
    }
  })

  it('renders 6 string line elements', () => {
    const { container } = render(<FretboardSVG />)
    expect(
      container.querySelectorAll('[data-testid^="string-"]'),
    ).toHaveLength(6)
  })

  it('renders 13 fret line elements (nut + 12 frets)', () => {
    const { container } = render(<FretboardSVG />)
    expect(
      container.querySelectorAll('[data-testid^="fret-line-"]'),
    ).toHaveLength(13)
  })
})

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

describe('FretboardSVG — highlights', () => {
  it('renders an amber highlight dot at the given string/fret', () => {
    const { container } = render(
      <FretboardSVG
        highlights={[{ position: { string: 'A', fret: 2 }, color: 'amber' }]}
      />,
    )
    const dot = container.querySelector('[data-testid="highlight-A-2"]')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('data-color', 'amber')
  })

  it('renders a green highlight dot at the given string/fret', () => {
    const { container } = render(
      <FretboardSVG
        highlights={[{ position: { string: 'E', fret: 5 }, color: 'green' }]}
      />,
    )
    const dot = container.querySelector('[data-testid="highlight-E-5"]')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('data-color', 'green')
  })

  it('renders a red highlight dot at the given string/fret', () => {
    const { container } = render(
      <FretboardSVG
        highlights={[{ position: { string: 'G', fret: 0 }, color: 'red' }]}
      />,
    )
    const dot = container.querySelector('[data-testid="highlight-G-0"]')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('data-color', 'red')
  })

  it('renders multiple highlights simultaneously', () => {
    const { container } = render(
      <FretboardSVG
        highlights={[
          { position: { string: 'E', fret: 0 }, color: 'amber' },
          { position: { string: 'A', fret: 5 }, color: 'green' },
          { position: { string: 'e', fret: 12 }, color: 'red' },
        ]}
      />,
    )
    expect(
      container.querySelector('[data-testid="highlight-E-0"]'),
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-testid="highlight-A-5"]'),
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-testid="highlight-e-12"]'),
    ).toBeInTheDocument()
  })

  it('renders no highlight dots when highlights is an empty array', () => {
    const { container } = render(<FretboardSVG highlights={[]} />)
    expect(
      container.querySelectorAll('[data-testid^="highlight-"]'),
    ).toHaveLength(0)
  })

  it('renders no highlight dots when highlights prop is omitted', () => {
    const { container } = render(<FretboardSVG />)
    expect(
      container.querySelectorAll('[data-testid^="highlight-"]'),
    ).toHaveLength(0)
  })
})

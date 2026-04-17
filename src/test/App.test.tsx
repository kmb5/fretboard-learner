import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders app heading', () => {
  render(<App />)
  expect(screen.getByText('Fretboard Learner')).toBeInTheDocument()
})

test('renders ModeSelector as the initial view', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
})

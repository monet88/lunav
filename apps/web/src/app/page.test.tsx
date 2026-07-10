import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import HomePage from './page'

test('renders the Foundation web shell', () => {
  render(<HomePage />)

  expect(screen.getByRole('main')).toHaveTextContent('ZIWEI AI')
})
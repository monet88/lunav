import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import RootLayout from './layout'

test('declares Vietnamese document language in the Foundation layout', () => {
  const markup = renderToStaticMarkup(
    <RootLayout>
      <main>ZIWEI AI</main>
    </RootLayout>
  )

  expect(markup).toContain('<html lang="vi">')
})
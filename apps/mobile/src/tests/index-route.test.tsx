import { render } from '@testing-library/react-native'
import IndexRoute from '@/app/index'

test('renders the Foundation mobile shell', async () => {
  const { getByText } = await render(<IndexRoute />)

  expect(getByText('ZIWEI AI')).toBeTruthy()
})
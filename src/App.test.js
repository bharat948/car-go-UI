import { render, screen } from '@testing-library/react';
import App from './App';
import { UserProvider } from './contexts/UserContext';

jest.mock('./api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

jest.mock('./components/MapComponent', () => ({
  __esModule: true,
  default: () => null,
}));

test('home route renders headline', async () => {
  render(
    <UserProvider>
      <App />
    </UserProvider>
  );

  expect(await screen.findByText(/track every/i)).toBeInTheDocument();
});

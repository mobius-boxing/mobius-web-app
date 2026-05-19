import React, { ReactNode } from 'react';

export const useNavigate = jest.fn();
export const useLocation = jest.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}));
export const useParams = jest.fn(() => ({}));
export const useSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()]);

export const MemoryRouter: React.FC<{ children: ReactNode; initialEntries?: any[] }> = ({ children }) => (
  <>{children}</>
);

export const BrowserRouter: React.FC<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const Routes: React.FC<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const Route: React.FC<{ path?: string; element?: ReactNode; children?: ReactNode }> = ({ element, children }) => (
  <>{element || children}</>
);

export const Navigate: React.FC<{ to: string; replace?: boolean }> = () => null;

export const Link: React.FC<{ to: string; children: ReactNode; className?: string }> = ({ children, ...props }) => (
  <a href="#" {...props}>{children}</a>
);

export const NavLink: React.FC<{ to: string; children: ReactNode; className?: string | ((props: any) => string) }> = ({ children, className, ...props }) => (
  <a href="#" className={typeof className === 'function' ? className({ isActive: false }) : className} {...props}>{children}</a>
);

export const Outlet: React.FC = () => null;

export const useMatch = jest.fn(() => null);
export const useRoutes = jest.fn(() => null);
export const matchPath = jest.fn(() => null);
export const generatePath = jest.fn((path: string) => path);
export const createSearchParams = jest.fn((init?: any) => new URLSearchParams(init));

export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  Outlet,
  useMatch,
  useRoutes,
  matchPath,
  generatePath,
  createSearchParams,
};

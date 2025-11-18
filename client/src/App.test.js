import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("react-router-dom", () => {
  const Stub = ({ children, "data-testid": dataTestId }) => (
    <div data-testid={dataTestId || undefined}>{children}</div>
  );
  const NavLink = ({ to, children, ...rest }) => (
    <a href={typeof to === "string" ? to : "#"} {...rest}>
      {children}
    </a>
  );
  return {
    BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => element ?? null,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
    Outlet: Stub,
    useNavigate: () => () => {},
    useLocation: () => ({ pathname: "/", search: "" }),
    useSearchParams: () => [new URLSearchParams(), () => {}],
    NavLink,
    Link: NavLink,
  };
});

jest.mock("./auth/authContext", () => ({
  useSession: () => ({
    session: { user: { id: "test-user" } },
    loading: false,
    isProfileComplete: true,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock("./components/ui/ToastProvider", () => ({
  ToastProvider: ({ children }) => <>{children}</>,
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

import App from "./App";

test("renders app routes without crashing", () => {
  render(<App />);
  expect(screen.getByTestId("router")).toBeInTheDocument();
  expect(screen.getByTestId("routes")).toBeInTheDocument();
});

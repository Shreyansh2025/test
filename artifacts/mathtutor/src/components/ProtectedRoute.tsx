import { Route, Redirect } from "wouter";
import { useAuthContext } from "./AuthProvider";

interface Props {
  path: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ path, children }: Props) {
  const { isAuthenticated } = useAuthContext();
  return (
    <Route path={path}>
      {isAuthenticated ? children : <Redirect to="/login" />}
    </Route>
  );
}

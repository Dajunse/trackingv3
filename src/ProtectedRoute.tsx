import { Navigate, useLocation, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  if (!token) {
    // Pasamos la ubicación actual en el 'state' para que el login pueda retornar aquí
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectCurrentUser } from "../../redux/features/auth/authSlice";

const RequireRole = ({ allowedRoles, children }) => {

  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRoles = user.roles || [];

  if (allowedRoles.includes("ANY_TEAM_MEMBER") && user.companyId) {
    return children;
  }

  const hasRole = userRoles.some(role =>
    allowedRoles.includes(role)
  );

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export default RequireRole;
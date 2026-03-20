import { useSelector } from "react-redux";
import { selectPermissions } from "../../redux/features/auth/authSlice";

const PermissionGuard = ({ permission, children }) => {

  const permissions = useSelector(selectPermissions)|| [];

  if (!permissions || !permissions.includes(permission)) {
  return null;
}

  return children;
};prepareHeaders: (headers, { getState }) => {

  const token =
    localStorage.getItem("accessToken") ||
    getState().auth?.token;

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

export default PermissionGuard;
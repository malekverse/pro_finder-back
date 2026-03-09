/* eslint-disable react/prop-types */
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../redux/features/auth/authSlice";

const RequireAuth = ({ children }) => {

  const reduxToken = useSelector(selectCurrentToken);

  const cookieToken = Cookies.get("accessToken");

  const token = reduxToken || cookieToken;

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default RequireAuth;
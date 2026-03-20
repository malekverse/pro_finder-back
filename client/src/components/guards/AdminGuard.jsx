import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RequireAdmin = ({ children }) => {

  const user = useSelector((state) => state.auth.user);

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RequireAdmin;
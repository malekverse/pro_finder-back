import { useSelector } from "react-redux";
import { selectPermissions } from "../redux/features/auth/authSlice";

const usePermissions = () => {

  const permissions = useSelector(selectPermissions);

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  return { permissions, hasPermission };
};

export default usePermissions;
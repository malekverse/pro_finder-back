import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { PencilLine, Trash2, Loader2, Check, X } from "lucide-react"; 
import tableStyles from "../../../styles/table.module.css";

const CompanyUsersList = forwardRef((props, ref) => {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [editingEmail, setEditingEmail] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);

  const token =
    useSelector((state) => state.auth.token) ||
    localStorage.getItem("accessToken");

  const fetchRoles = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:5000/roles/getRoles", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setAvailableRoles(response.data);
    } catch (err) {
      console.error("Erreur récupération rôles:", err);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;

    try {

      setLoading(true);

      const response = await axios.get(
        "http://localhost:5000/company/users",
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      setUsers(response.data);

    } catch (err) {

      setError("Impossible de charger les membres.");

    } finally {

      setLoading(false);

    }
  };

  useImperativeHandle(ref, () => ({
    refetchUsers: fetchUsers
  }));

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [token]);

  // DELETE ROLE
  const handleDelete = async (userEmail) => {

    if (!window.confirm(`Retirer le rôle de ${userEmail} ?`)) return;

    try {

      setActionLoading(userEmail);

      await axios.delete(
        "http://localhost:5000/company/delete-role",
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          data: { email: userEmail }
        }
      );

      setUsers(
        users.map((u) =>
          u.user_id?.email === userEmail
            ? { ...u, role_id: null }
            : u
        )
      );

    } catch (err) {

      alert("Erreur lors de la suppression.");

    } finally {

      setActionLoading(null);

    }
  };

  // UPDATE ROLE
  const handleUpdate = async (userEmail) => {

    if (!newRoleId) return setEditingEmail(null);

    try {

      setActionLoading(userEmail);

      await axios.put(
        "http://localhost:5000/company/update-role",
        {
          email: userEmail,
          role_id: newRoleId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      setEditingEmail(null);

      await fetchUsers();

    } catch (err) {

      alert("La mise à jour a échoué côté serveur.");

    } finally {

      setActionLoading(null);

    }
  };

  if (loading)
    return (
      <div className={tableStyles.loader}>
        <Loader2 className={tableStyles.spin} />
      </div>
    );

  return (
    <div className={tableStyles.tableContainer}>
      <table className={tableStyles.customTable}>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Permissions</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.filter((u) => u.role_id).map((user) => (
            <tr key={user._id}>
              <td>
                <div className={tableStyles.userCell}>
                  <div className={tableStyles.avatarSmall}>
                    {user.user_id?.fullName?.charAt(0)}
                  </div>

                  <div>
                    <div className={tableStyles.userName}>
                      {user.user_id?.fullName}
                    </div>

                    <div className={tableStyles.userEmail}>
                      {user.user_id?.email}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                {editingEmail === user.user_id?.email ? (

                  <select
                    className={tableStyles.selectInline}
                    value={newRoleId}
                    onChange={(e) =>
                      setNewRoleId(e.target.value)
                    }
                  >

                    <option value="">
                      Choisir...
                    </option>

                    {availableRoles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name.replace("_", " ")}
                      </option>
                    ))}

                  </select>

                ) : (

                  <span
                    className={`${tableStyles.badge} ${
                      user.role_id?.name === "admin"
                        ? tableStyles.adminBadge
                        : ""
                    }`}
                  >
                    {user.role_id?.name?.replace("_", " ")}
                  </span>

                )}
              </td>

              <td className={tableStyles.permissionsCell}>
                {user.role_id?.permissions?.join(", ")}
              </td>

              <td>
                <div className={tableStyles.actionGroup}>
                  {editingEmail === user.user_id?.email ? (
                    <>
                      <button
                        className={tableStyles.saveBtn}
                        onClick={() =>
                          handleUpdate(user.user_id?.email)
                        }
                      >
                        <Check size={18} />
                      </button>

                      <button
                        className={tableStyles.cancelBtn}
                        onClick={() => setEditingEmail(null)}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={tableStyles.editIconBtn}
                        onClick={() => {
                          setEditingEmail(
                            user.user_id?.email
                          );
                          setNewRoleId(
                            user.role_id?._id || ""
                          );
                        }}
                      >
                        <PencilLine size={18} />
                      </button>

                      <button
                        className={tableStyles.deleteIconBtn}
                        onClick={() =>
                          handleDelete(
                            user.user_id?.email
                          )
                        }
                        disabled={
                          actionLoading ===
                          user.user_id?.email
                        }
                      >
                        {actionLoading ===
                        user.user_id?.email ? (
                          <Loader2
                            size={16}
                            className={tableStyles.spin}
                          />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default CompanyUsersList;
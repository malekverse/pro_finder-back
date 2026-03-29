const Role = require("../models/Role");
const Activity = require("../models/Activity");

// créer un role global
const createRole = async (req, res) => {

  try {

    const { name, permissions } = req.body;
    if(!name || !permissions)
      return res.status(400).json({ message: "name and permissions are required" });
    
    // Vérifier si le rôle existe déjà
    const existingNameRole = await Role.findOne({ name });
    if (existingNameRole)
      return res.status(400).json({ message: "Role name already exists" });

    const existingPermissionsRole = await Role.findOne({ permissions });
    if (existingPermissionsRole)
      return res.status(400).json({ message: "A role with the same permissions already exists." });


    const role = await Role.create({
      name,
      permissions
    });

    await Activity.create({
      adminId: req.user,
      action: "Création de rôle",
      target: name,
      status: "success"
    });
    

    res.status(201).json(role);

  } catch (err) {

    res.status(500).json({ message: "create role failed" });

  }

};


// voir tous les roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();

    // Si aucun rôle n'existe du tout, on crée les rôles de base
    if (roles.length === 0) {
      const defaultRoles = [
        { 
          name: "owner", 
          permissions: [
            "manage_all", 
            "manage_roles", 
            "manage_settings", 
            "assign_role", 
            "delete_role", 
            "update_role",
            "view_stats"
          ] 
        },
        { name: "manager", permissions: ["view_stats", "manage_users", "create_post"] },
        { name: "viewer", permissions: ["view_only"] }
      ];
      await Role.insertMany(defaultRoles);
      const allRoles = await Role.find();
      return res.json(allRoles);
    }

    res.json(roles);
  } catch (err) {
    res.status(500).json({ message:"get roles failed" });
  }
};


// update role
const updateRole = async (req, res) => {

  try {

// Dans updateRole et deleteRole
const role = await Role.findById(req.params.roleId); // Utilise roleId pour correspondre à la route
    if (!role)
      return res.status(404).json({ message: "Role not found" });

    role.name = req.body.name || role.name;
    role.permissions = req.body.permissions || role.permissions;

    await role.save();

    await Activity.create({
      adminId: req.user,
      action: "Modification de rôle",
      target: role.name,
      status: "info"
    });

    res.json(role);

  } catch (err) {

    res.status(500).json({ message:"update role failed" });

  }

};


// delete role
const deleteRole = async (req, res) => {

  try {
    const { roleId } = req.params;

    // Vérifier si le rôle est utilisé par une entreprise (via Follow)
    const Follow = require("../models/follow");
    const isUsed = await Follow.findOne({ role_id: roleId });

    if (isUsed) {
      return res.status(400).json({ 
        message: "Un rôle déjà utilisé par une entreprise ne peut pas être supprimé." 
      });
    }

    const role = await Role.findById(roleId); 
    if (!role)
      return res.status(404).json({ message: "Role not found" });

    const name = role.name;
    await role.deleteOne();

    await Activity.create({
      adminId: req.user,
      action: "Suppression de rôle",
      target: name,
      status: "error"
    });

    res.json({ message: "Role deleted" });

  } catch (err) {

    res.status(500).json({ message:"delete role failed" });

  }

};


module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
};
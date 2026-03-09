const Role = require("../models/Role");

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
    

    res.status(201).json(role);

  } catch (err) {

    res.status(500).json({ message: "create role failed" });

  }

};


// voir tous les roles
const getRoles = async (req, res) => {

  try {

    const roles = await Role.find();

    res.json(roles);

  } catch (err) {

    res.status(500).json({ message:"get roles failed" });

  }

};


// update role
const updateRole = async (req, res) => {

  try {

    const role = await Role.findById(req.params.id);

    if (!role)
      return res.status(404).json({ message: "Role not found" });

    role.name = req.body.name || role.name;
    role.permissions = req.body.permissions || role.permissions;

    await role.save();

    res.json(role);

  } catch (err) {

    res.status(500).json({ message:"update role failed" });

  }

};


// delete role
const deleteRole = async (req, res) => {

  try {

    const role = await Role.findById(req.params.id);

    if (!role)
      return res.status(404).json({ message: "Role not found" });

    await role.deleteOne();

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
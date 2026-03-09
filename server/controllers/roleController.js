const Role = require("../models/Role");

// créer un role global
const createRole = async (req, res) => {

  try {

    const { name, permissions } = req.body;

    const role = await Role.create({
      name,
      permissions
    });

    res.status(201).json(role);

  } catch (err) {

    res.status(500).json({ message: err.message });

  }

};


// voir tous les roles
const getRoles = async (req, res) => {

  try {

    const roles = await Role.find();

    res.json(roles);

  } catch (err) {

    res.status(500).json({ message: err.message });

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

    res.status(500).json({ message: err.message });

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

    res.status(500).json({ message: err.message });

  }

};


module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
};
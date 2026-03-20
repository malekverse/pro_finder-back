const Service = require("../../models/Service");

const getServicesBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    const services = await Service.find({
      subcategory_id: subCategoryId
    });

    res.json(services);

  } catch (err) {
    res.status(500).json({ message: "Error getting services" });
    }
}

const createService = async (req,res)=>{
    try {
        const { name, subcategory_id } = req.body;  // <-- CORRECT
        if(!name || !subcategory_id){
            return res.status(400).json({ message: "Name and subcategory_id are required" });
        }
        const service = new Service({ name, subcategory_id }); // <-- CORRECT
        await service.save();
        res.status(201).json({ message: "Service created successfully", service });
    } catch (err) {
        console.error("Error creating service:", err);
        res.status(500).json({ message: "Error creating service" });
    }
};

const updateService=async (req,res)=>{
    try {
        const { id } = req.params;
        const { name,  subcategory_id } = req.body;
        const service = await Service.findByIdAndUpdate(id, { name, subcategory_id });
        if (!service){
             return res.status(404).json({ message: "Service not found" });}
        res.json({ message: "Service updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating service" });
    }
}

const deleteService=async (req,res)=>{
    try {
        const { id } = req.params;
        const service = await Service.findByIdAndDelete(id);
        if (!service){
             return res.status(404).json({ message: "Service not found" });}
        res.json({ message: "Service deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting service" });
    }
};
 
const getServicesByCompany=async (req,res)=>{
    try {
        const { companyId } = req.params;
        const services = await Service.find({ company_id: companyId });
        if (!services){
             return res.status(404).json({ message: "Services not found" });}
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Error getting services" });
    }
};
const getServices=async (req,res)=>{
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: "Error fetching services" });
    }
};



module.exports={
    getServicesBySubCategory,
    createService,
    updateService,
    deleteService,
    getServicesByCompany,
    getServices
}
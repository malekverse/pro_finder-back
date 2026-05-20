const SubCategory = require("../../models/SubCategory");
const Activity = require("../../models/Activity");

const getSubCategories = async (req,res)=>{
    try {
        const subCategories = await SubCategory.find();
        res.json(subCategories);
    } catch (err) {
        res.status(500).json({ message: "Error fetching subcategories" });
    }
};

const getSubCategoriesByCategory=async (req,res)=>{
    try {
        const { categoryId } = req.params;
        const subCategories = await SubCategory.find({ category_id: categoryId });
        res.json(subCategories);
    } catch (err) {
        res.status(500).json({ message: "Error fetching subcategories" });
    }
}

const createSubCategory=async (req,res)=>{
    try {
        const { category_id, name } = req.body;
        const subCategory = new SubCategory({ category_id, name });
        await subCategory.save();

        if (req.user) {
            await Activity.create({
                adminId: req.user,
                action: "Création de sous-catégorie",
                target: name,
                status: "success"
            });
        }

        res.json({ message: "Subcategory created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating subcategory" });
    }
};

const updateSubCategory=async (req,res)=>{
    try {
        const { id } = req.params;
        const { name } = req.body;
        const subCategory = await SubCategory.findByIdAndUpdate(id, { name });
        if (!subCategory){
             return res.status(404).json({ message: "Subcategory not found" });}

        if (req.user) {
            await Activity.create({
                adminId: req.user,
                action: "Modification de sous-catégorie",
                target: name,
                status: "info"
            });
        }
        
        res.json({ message: "Subcategory updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating subcategory" });
    }
};

const deleteSubCategory=async (req,res)=>{
    try {
        const { id } = req.params;

        const Service = require("../../models/Service");
        const Company = require("../../models/company");

        // 1. Vérifier s'il y a des services liés
        const linkedService = await Service.findOne({ subcategory_id: id });
        if (linkedService) {
            return res.status(400).json({
                message: "Suppression impossible : des services sont liés à cette sous-catégorie."
            });
        }

        // 2. Vérifier si des entreprises sont liées via les services de cette sous-catégorie
        const services = await Service.find({ subcategory_id: id });
        const serviceIds = services.map(s => s._id);
        const linkedCompany = await Company.findOne({ services: { $in: serviceIds } });

        if (linkedCompany) {
            return res.status(400).json({
                message: "Suppression impossible : des entreprises sont liées à cette sous-catégorie via ses services."
            });
        }

        const subCategory = await SubCategory.findById(id);
        if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

        const name = subCategory.name;
        await SubCategory.findByIdAndDelete(id);

        if (req.user) {
            await Activity.create({
                adminId: req.user,
                action: "Suppression de sous-catégorie",
                target: name,
                status: "error"
            });
        }
        
        res.json({ message: "Subcategory deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting subcategory" });
    }
};


module.exports={
    getSubCategoriesByCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategories
}

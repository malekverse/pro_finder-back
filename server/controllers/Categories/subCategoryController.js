const SubCategory = require("../../models/SubCategory");


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
        
        res.json({ message: "Subcategory updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating subcategory" });
    }
};

const deleteSubCategory=async (req,res)=>{
    try {
        const { id } = req.params;
        const subCategory = await SubCategory.findByIdAndDelete(id);
        if (!subCategory){
             return res.status(404).json({ message: "Subcategory not found" });}
        
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

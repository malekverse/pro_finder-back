const Category = require("../../models/Category");

const getCategories=async(req,res)=>{
  try{
    const categories=await Category.find();
    res.json(categories);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Error fetching categories"});
  }
}

const createCategorie = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!category){
        return res.status(404).json({ message: "Category not found" });}
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating category" });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndRemove(id);
    if (!category) 
        return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting category" });
  }
};

module.exports ={
    getCategories,
    createCategorie,
    updateCategory,
    deleteCategory
}
const User=require("../models/User");


const getDashboard = async (req, res) => {
  res.json({
    message: "User Dashboard",
    userId: req.user.id
  });
};

const getAllUsers=async (req,res)=>{
    const users=await User.find().select("-password").lean();
   if(!users){
    return res.status(400).json({message:"No users found"});
   }
   res.json(users);
};


module.exports={getAllUsers,getDashboard};

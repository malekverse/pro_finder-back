const companyMemberSchema = new mongoose.Schema({
  user:      { type: ObjectId, ref: 'User' },
  company:   { type: ObjectId, ref: 'Company' },
  role:      { type: ObjectId, ref: 'Role' },
  grantedBy: { type: ObjectId, ref: 'User' },  // owner qui a assigné
});
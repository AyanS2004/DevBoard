const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // URL or base64
  darkMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 
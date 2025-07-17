const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  entry: { type: String, required: true },
  mood: { type: Number, min: 1, max: 5 }, // Optional mood rating
  productivity: { type: Number, min: 1, max: 5 }, // Optional productivity score
}, { timestamps: true });

module.exports = mongoose.model('Journal', JournalSchema); 
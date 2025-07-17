const mongoose = require('mongoose');

const PomodoroSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  totalMinutes: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Pomodoro', PomodoroSchema); 
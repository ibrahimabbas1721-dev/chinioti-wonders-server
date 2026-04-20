const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  thumbnail:   { type: String, required: true },
  videoUrl:    { type: String, required: true },
  platform:    { 
    type: String, 
    enum: ['tiktok', 'instagram', 'facebook', 'youtube'],
    required: true 
  },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Video', videoSchema)
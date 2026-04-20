const Video = require('../models/Video')
const cloudinary = require('cloudinary').v2
const uploadToCloudinary = require('../utils/uploadToCloudinary')
const { deleteFromCloudinary } = require('../utils/uploadToCloudinary')

exports.getAll = async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true }).sort({ createdAt: -1 })
    res.json(videos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { title, videoUrl, platform } = req.body
    if (!title || !videoUrl || !platform) {
      return res.status(400).json({ message: 'Title, video URL and platform are required' })
    }
    let thumbnail = ''
    if (req.file) {
      thumbnail = await uploadToCloudinary(req.file.buffer)
    }
    const video = await Video.create({ title, videoUrl, platform, thumbnail })
    res.status(201).json(video)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { title, videoUrl, platform, isActive } = req.body
    const updateData = { title, videoUrl, platform, isActive }
    if (req.file) {
      updateData.thumbnail = await uploadToCloudinary(req.file.buffer)
    }
    const video = await Video.findByIdAndUpdate(req.params.id, updateData, { new: true })
    if (!video) return res.status(404).json({ message: 'Video not found' })
    res.json(video)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ message: 'Video not found' })
    
    // Delete thumbnail from Cloudinary if it exists
    if (video.thumbnail) {
      await deleteFromCloudinary(video.thumbnail)
    }
    
    // Delete video from database
    await Video.findByIdAndDelete(req.params.id)
    res.json({ message: 'Video deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
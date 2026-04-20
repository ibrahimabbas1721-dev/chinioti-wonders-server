const Category = require('../models/Category')
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    ).end(buffer)
  })
}

const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary')) return

    // Extract public_id correctly from Cloudinary URL
    const uploadIndex = imageUrl.indexOf('/upload/')
    if (uploadIndex === -1) return

    // Get everything after /upload/
    let afterUpload = imageUrl.substring(uploadIndex + 8)

    // Remove version number if present (v1234567890/)
    if (afterUpload.startsWith('v') && afterUpload.indexOf('/') !== -1) {
      afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1)
    }

    // Remove file extension
    const publicId = afterUpload.substring(0, afterUpload.lastIndexOf('.'))

    console.log('Deleting from Cloudinary:', publicId)
    const result = await cloudinary.uploader.destroy(publicId)
    console.log('Cloudinary delete result:', result)
  } catch (err) {
    console.error('Cloudinary delete error:', err)
  }
}

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find()
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, slug } = req.body
    let image = ''
    if (req.file) {
      image = await uploadToCloudinary(req.file.buffer)
    }
    const category = await Category.create({ name, slug, image })
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, slug } = req.body
    const updateData = { name, slug }

    if (req.file) {
      // Delete old image from Cloudinary first
      const existing = await Category.findById(req.params.id)
      if (existing?.image) {
        await deleteFromCloudinary(existing.image)
      }
      // Upload new image
      updateData.image = await uploadToCloudinary(req.file.buffer)
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    res.json(category)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.delete = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    // Delete image from Cloudinary when category is deleted
    if (category?.image) {
      await deleteFromCloudinary(category.image)
    }
    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
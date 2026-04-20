const Product = require('../models/Product')
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
    // URL format: .../upload/v1234567890/furniture-store/filename.jpg
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

const processBooleanFields = (data) => {
  const boolFields = ['inStock', 'isFeatured', 'isNewArrival', 'isBestSeller', 'customOrderAvailable']
  const numberFields = ['price']
  const processed = { ...data }

  boolFields.forEach(field => {
    if (field in processed && typeof processed[field] === 'string') {
      processed[field] = processed[field] === 'true'
    }
  })

  numberFields.forEach(field => {
    if (field in processed && processed[field]) {
      processed[field] = parseFloat(processed[field])
    }
  })

  return processed
}

exports.getAll = async (req, res, next) => {
  try {
    const { category, featured, newArrival, bestSeller, search } = req.query
    let filter = {}

    if (category)   filter.category = category
    if (featured)   filter.isFeatured = true
    if (newArrival) filter.isNewArrival = true
    if (bestSeller) filter.isBestSeller = true
    if (search)     filter.name = { $regex: search, $options: 'i' }

    const products = await Product.find(filter).populate('category', 'name slug')
    res.json(products)
  } catch (err) {
    next(err)
  }
}

exports.getOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug')
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (err) {
    next(err)
  }
}

exports.create = async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.price || !req.body.category) {
      return res.status(400).json({ message: 'Name, price, and category are required' })
    }

    let images = []
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer))
      images = await Promise.all(uploadPromises)
    }

    const processedData = processBooleanFields(req.body)
    let variants = []
if (req.body.variants) {
  try {
    variants = JSON.parse(req.body.variants)
  } catch (e) {
    variants = []
  }
}
    const product = await Product.create({ ...processedData, images, variants })
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const existingProduct = await Product.findById(req.params.id)
    if (!existingProduct) return res.status(404).json({ message: 'Product not found' })

    // Get images admin wants to keep
    let keptImages = []
    if (req.body.keptImages) {
      keptImages = Array.isArray(req.body.keptImages)
        ? req.body.keptImages
        : [req.body.keptImages]
    }

    // Delete removed images from Cloudinary
    const removedImages = existingProduct.images.filter(
      img => !keptImages.includes(img)
    )
    for (const img of removedImages) {
      await deleteFromCloudinary(img)
    }

    // Upload new images
    let newImages = []
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer))
      newImages = await Promise.all(uploadPromises)
    }

    // Final images = kept + new
    const finalImages = [...keptImages, ...newImages]

    const processedData = processBooleanFields(req.body)
    delete processedData.keptImages

    let variants = []
if (req.body.variants) {
  try {
    variants = JSON.parse(req.body.variants)
  } catch (e) {
    variants = []
  }
}

    const product = await Product.findByIdAndUpdate(
  req.params.id,
  { ...processedData, images: finalImages, variants },
  { new: true }
)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    // Delete all images from Cloudinary
    for (const img of product.images) {
      await deleteFromCloudinary(img)
    }

    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product deleted' })
  } catch (err) {
    next(err)
  }
}
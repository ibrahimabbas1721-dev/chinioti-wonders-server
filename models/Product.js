const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema({
  name:  { type: String, required: true }, // e.g. "Bed + Sidetables"
  price: { type: Number, required: true }, // e.g. 243000
})

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  price:        { type: Number, required: true }, // base price
  variants:     [variantSchema], // ← ADD THIS
  category:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  material:     { type: String, default: '' },
  dimensions:   { type: String, default: '' },
  weight:       { type: String, default: '' },
  color:        { type: String, default: '' },
  finish:       { type: String, default: '' },
  deliveryTime: { type: String, default: '1-3 business months' },
  warranty:     { type: String, default: '1 year manufacturer warranty' },
  careInstructions:     { type: String, default: '' },
  customOrderAvailable: { type: Boolean, default: false },
  images:       [{ type: String }],
  inStock:      { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
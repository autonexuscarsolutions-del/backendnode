require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1); // Exit if cannot connect
});

// Middlewares
app.use(cors());
app.use(express.json());
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));


// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Enhanced Product Schema with more fields and validation
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  brand: { type: String, default: "" },
  model: { type: String, default: "" },
  year: { type: Number, default: null },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: null, min: 0 },
  status: { 
    type: String, 
    enum: ["In Stock", "Out of Stock", "Limited Stock", "Pre-Order", "Discontinued"],
    default: "In Stock"
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  image: { type: String, default: "" },
  images: [{ type: String }], // Multiple images
  badge: { 
    type: String, 
    enum: ["", "Best Seller", "New Arrival", "Hot Deal", "Premium", "Limited Edition", "Sale", "Trending"],
    default: ""
  },
  description: { type: String, default: "" },
  specifications: {
    weight: { type: String, default: "" },
    dimensions: { type: String, default: "" },
    material: { type: String, default: "" },
    color: { type: String, default: "" },
    warranty: { type: String, default: "" },
    compatibility: [{ type: String }], // Compatible vehicle models
    partNumber: { type: String, default: "" },
    origin: { type: String, default: "" }
  },
  stock: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model("Product", productSchema);

// Category Schema for dynamic categories
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  subcategories: [{ 
    name: String,
    description: String
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model("Category", categorySchema);

// Brand Schema
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String, default: "" },
  description: { type: String, default: "" },
  website: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Brand = mongoose.model("Brand", brandSchema);

// Initialize default categories if they don't exist
const initializeCategories = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        {
          name: "Braking System",
          description: "Brake pads, rotors, calipers, and brake fluids",
          subcategories: [
            { name: "Brake Pads", description: "High-performance brake pads" },
            { name: "Brake Rotors", description: "Disc brake rotors and drums" },
            { name: "Brake Calipers", description: "Brake calipers and hardware" },
            { name: "Brake Fluids", description: "DOT 3, DOT 4, and DOT 5 brake fluids" },
            { name: "Brake Lines", description: "Brake hoses and steel lines" }
          ]
        },
        {
          name: "Engine Components",
          description: "Engine parts, filters, and performance upgrades",
          subcategories: [
            { name: "Air Filters", description: "Engine air filters and intakes" },
            { name: "Oil Filters", description: "Engine oil filters" },
            { name: "Fuel Filters", description: "Fuel system filters" },
            { name: "Spark Plugs", description: "Ignition spark plugs and coils" },
            { name: "Belts & Hoses", description: "Engine belts and cooling hoses" },
            { name: "Gaskets & Seals", description: "Engine gaskets and sealing components" }
          ]
        },
        {
          name: "Lighting",
          description: "Headlights, taillights, and interior lighting",
          subcategories: [
            { name: "Headlights", description: "LED, HID, and halogen headlights" },
            { name: "Taillights", description: "Rear lighting systems" },
            { name: "Interior Lights", description: "Cabin and dashboard lighting" },
            { name: "Signal Lights", description: "Turn signals and hazard lights" },
            { name: "Light Bulbs", description: "Replacement bulbs and LEDs" }
          ]
        },
        {
          name: "Suspension",
          description: "Shocks, struts, springs, and suspension components",
          subcategories: [
            { name: "Shock Absorbers", description: "Front and rear shock absorbers" },
            { name: "Struts", description: "MacPherson and coilover struts" },
            { name: "Springs", description: "Coil springs and leaf springs" },
            { name: "Bushings", description: "Suspension bushings and mounts" },
            { name: "Sway Bars", description: "Anti-roll bars and links" }
          ]
        },
        {
          name: "Exhaust System",
          description: "Mufflers, catalytic converters, and exhaust pipes",
          subcategories: [
            { name: "Mufflers", description: "Performance and OEM mufflers" },
            { name: "Catalytic Converters", description: "Emissions control systems" },
            { name: "Exhaust Pipes", description: "Headers and exhaust tubing" },
            { name: "Resonators", description: "Sound dampening components" }
          ]
        },
        {
          name: "Interior",
          description: "Seats, dashboard, and interior accessories",
          subcategories: [
            { name: "Seat Covers", description: "Custom and universal seat covers" },
            { name: "Floor Mats", description: "All-weather and carpet floor mats" },
            { name: "Dashboard", description: "Dashboard covers and accessories" },
            { name: "Steering Wheels", description: "Aftermarket steering wheels" },
            { name: "Interior Trim", description: "Decorative interior components" }
          ]
        },
        {
          name: "Exterior",
          description: "Body parts, mirrors, and exterior accessories",
          subcategories: [
            { name: "Bumpers", description: "Front and rear bumpers" },
            { name: "Mirrors", description: "Side and rearview mirrors" },
            { name: "Grilles", description: "Front grilles and mesh inserts" },
            { name: "Body Kits", description: "Aerodynamic body components" },
            { name: "Spoilers", description: "Rear and front spoilers" }
          ]
        },
        {
          name: "Tires & Wheels",
          description: "Tires, rims, and wheel accessories",
          subcategories: [
            { name: "All-Season Tires", description: "Year-round tire options" },
            { name: "Performance Tires", description: "High-performance tires" },
            { name: "Winter Tires", description: "Snow and ice tires" },
            { name: "Alloy Wheels", description: "Lightweight alloy rims" },
            { name: "Steel Wheels", description: "Durable steel rims" },
            { name: "Wheel Accessories", description: "Lug nuts, center caps, and valve stems" }
          ]
        },
        {
          name: "Electrical",
          description: "Batteries, alternators, and electrical components",
          subcategories: [
            { name: "Batteries", description: "Car batteries and accessories" },
            { name: "Alternators", description: "Charging system components" },
            { name: "Starters", description: "Engine starter motors" },
            { name: "Wiring", description: "Electrical wiring and connectors" },
            { name: "Fuses & Relays", description: "Electrical protection components" }
          ]
        },
        {
          name: "Cooling System",
          description: "Radiators, thermostats, and cooling components",
          subcategories: [
            { name: "Radiators", description: "Engine cooling radiators" },
            { name: "Water Pumps", description: "Coolant circulation pumps" },
            { name: "Thermostats", description: "Temperature control valves" },
            { name: "Cooling Fans", description: "Electric and mechanical fans" },
            { name: "Coolant", description: "Antifreeze and coolant fluids" }
          ]
        },
        {
          name: "Transmission",
          description: "Transmission parts and fluids",
          subcategories: [
            { name: "Transmission Fluid", description: "ATF and manual transmission oils" },
            { name: "Clutch Kits", description: "Manual transmission clutch components" },
            { name: "Torque Converters", description: "Automatic transmission components" },
            { name: "CV Joints", description: "Constant velocity joints and axles" }
          ]
        },
        {
          name: "Tools & Equipment",
          description: "Automotive tools and garage equipment",
          subcategories: [
            { name: "Hand Tools", description: "Wrenches, sockets, and screwdrivers" },
            { name: "Power Tools", description: "Electric and pneumatic tools" },
            { name: "Diagnostic Tools", description: "OBD scanners and multimeters" },
            { name: "Garage Equipment", description: "Jacks, stands, and lifts" }
          ]
        }
      ];

      await Category.insertMany(defaultCategories);
      console.log("Default categories initialized");
    }
  } catch (error) {
    console.error("Error initializing categories:", error);
  }
};

// Initialize categories on startup
initializeCategories();

// Routes

// GET all products with enhanced filtering and pagination
app.get("/api/products", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      subcategory,
      brand, 
      minPrice, 
      maxPrice, 
      status, 
      featured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (category && category !== 'All Categories') query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = brand;
    if (status) query.status = status;
    if (featured) query.featured = featured === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ... (keep all your previous imports and setup code the same)

// POST create product + image upload (enhanced)
app.post("/api/products", upload.array("images", 5), async (req, res) => {
  try {
    const data = req.body;
    
    // Parse JSON fields if they're strings
    const specifications = typeof data.specifications === 'string' 
      ? JSON.parse(data.specifications) 
      : data.specifications || {};
    
    const tags = typeof data.tags === 'string'
      ? JSON.parse(data.tags)
      : data.tags || [];

    const compatibility = typeof data.compatibility === 'string'
      ? JSON.parse(data.compatibility)
      : data.compatibility || [];

    // Validate rating before creating product
    const rating = data.rating ? Math.min(Math.max(Number(data.rating), 0), 5) : 0;
    // This ensures rating is between 0-5 (clamps the value)

    const product = new Product({
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: rating, // Use the validated rating
      reviews: Number(data.reviews) || 0,
      year: data.year ? Number(data.year) : null,
      stock: Number(data.stock) || 0,
      discount: Number(data.discount) || 0,
      featured: data.featured === 'true',
      image: req.files && req.files[0] ? `/uploads/${req.files[0].filename}` : "",
      images: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
      specifications: {
        ...specifications,
        compatibility
      },
      tags
    });
    
    await product.save();
    io.emit("productCreated", product);
    res.status(201).json(product);
  } catch (e) {
    console.error("Create product error:", e);
    res.status(500).json({ error: "Failed to create product", details: e.message });
  }
});

// PUT update product + image upload (enhanced)
app.put("/api/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const data = req.body;
    
    const specifications = typeof data.specifications === 'string' 
      ? JSON.parse(data.specifications) 
      : data.specifications || {};
    
    const tags = typeof data.tags === 'string'
      ? JSON.parse(data.tags)
      : data.tags || [];

    const compatibility = typeof data.compatibility === 'string'
      ? JSON.parse(data.compatibility)
      : data.compatibility || [];

    // Validate rating before updating product
    const rating = data.rating ? Math.min(Math.max(Number(data.rating), 0), 5) : undefined;
    // This ensures rating is between 0-5 (clamps the value)
    // If rating isn't provided, it won't be updated

    const updateData = {
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: rating, // Use the validated rating (or undefined if not provided)
      reviews: Number(data.reviews) || 0,
      year: data.year ? Number(data.year) : null,
      stock: Number(data.stock) || 0,
      discount: Number(data.discount) || 0,
      featured: data.featured === 'true',
      specifications: {
        ...specifications,
        compatibility
      },
      tags,
      updatedAt: Date.now()
    };

    // Remove rating from updateData if it wasn't provided
    if (rating === undefined) {
      delete updateData.rating;
    }

    if (req.files && req.files.length > 0) {
      updateData.image = `/uploads/${req.files[0].filename}`;
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    io.emit("productUpdated", product);
    res.json(product);
  } catch (e) {
    console.error("Update product error:", e);
    res.status(500).json({ error: "Failed to update product", details: e.message });
  }
});


// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    io.emit("productDeleted", req.params.id);
    res.json({ message: "Product deleted" });
  } catch (e) {
    console.error("Delete product error:", e);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Category Routes
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Brand Routes
app.get("/api/brands", async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

app.post("/api/brands", upload.single("logo"), async (req, res) => {
  try {
    const brand = new Brand({
      ...req.body,
      logo: req.file ? `/uploads/${req.file.filename}` : ""
    });
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ error: "Failed to create brand" });
  }
});

// Statistics Route
app.get("/api/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const inStock = await Product.countDocuments({ status: "In Stock", isActive: true });
    const outOfStock = await Product.countDocuments({ status: "Out of Stock", isActive: true });
    const featured = await Product.countDocuments({ featured: true, isActive: true });
    
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalProducts,
      inStock,
      outOfStock,
      featured,
      categoryStats
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Socket.IO connection log
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected", socket.id));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
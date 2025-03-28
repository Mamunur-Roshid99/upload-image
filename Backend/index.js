const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },

    credentials: true,
  })
);
app.use(express.json());

const PORT = 3001;

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://login:login@login.0pis22k.mongodb.net/FileUploadDB?retryWrites=true&w=majority&appName=login"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// File Model (optional - if you want to store file info in DB)
const FileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  mimetype: String,
  uploadedAt: { type: Date, default: Date.now },
});

const FileModel = mongoose.model("File", FileSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images only (JPEG, JPG, PNG, GIF)");
    }
  },
}).single("file");

// Upload Endpoint
app.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Save file info to MongoDB
      const newFile = new FileModel({
        filename: req.file.filename,
        path: `/public/images/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      await newFile.save();

      res.status(200).json({
        message: "File uploaded successfully",
        file: {
          id: newFile._id,
          filename: req.file.filename,
          url: `http://localhost:${PORT}/public/images/${req.file.filename}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Server error during upload" });
    }
  });
});

// Get all files (optional endpoint)
app.get("/files", async (req, res) => {
  try {
    const files = await FileModel.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.get("/", (req, res) => {
  res.send("hello world!");
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

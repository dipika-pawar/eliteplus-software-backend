const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// =====================================================
// IMPORT ROUTES
// =====================================================

const companyRoutes = require("./routes/companyRoutes");
const accountRoutes = require("./routes/accountRoutes");
const itemRoutes = require("./routes/itemRoutes");
const userRoutes = require("./routes/userRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const unitRoutes = require("./routes/unitRoutes");
const taxRoutes = require("./routes/taxRoutes");

// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// CORS CONFIGURATION
// =====================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =====================================================
// UPLOAD DIRECTORY
// =====================================================
//
// Local development:
//      ./uploads
//
// Vercel:
//      /tmp/uploads
//
// IMPORTANT:
// Vercel filesystem is temporary.
// Permanent files should be stored in Supabase Storage.
// =====================================================

const uploadsDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.join(__dirname, "uploads");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {
      recursive: true,
    });

    console.log(`📁 Upload directory created: ${uploadsDir}`);
  }
} catch (error) {
  console.error(
    "❌ Error creating upload directory:",
    error.message
  );
}

// =====================================================
// STATIC UPLOAD FILES
// =====================================================

app.use(
  "/uploads",
  express.static(uploadsDir)
);

// =====================================================
// ROOT ROUTE
// =====================================================
//
// This removes:
//      Cannot GET /
//
// When you open the Vercel backend URL,
// this response will be displayed.
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "ElitePlus Software Backend is running successfully!",
    environment: process.env.VERCEL
      ? "Vercel"
      : "Local",
    status: "OK",
  });
});

// =====================================================
// API HEALTH CHECK
// =====================================================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ElitePlus Software API is working!",
    status: "OK",

    availableRoutes: {
      company: "/api/company",
      account: "/api/account",
      item: "/api/item",
      user: "/api/user",
      quotation: "/api/quotation",
      unit: "/api/unit",
      tax: "/api/tax",
    },
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Company
app.use(
  "/api/company",
  companyRoutes
);

// Account / Party Master
app.use(
  "/api/account",
  accountRoutes
);

// Inventory / Items
app.use(
  "/api/item",
  itemRoutes
);

// Users
app.use(
  "/api/user",
  userRoutes
);

// Quotation / Invoice
app.use(
  "/api/quotation",
  quotationRoutes
);

// Units
app.use(
  "/api/unit",
  unitRoutes
);

// Tax
app.use(
  "/api/tax",
  taxRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error(
    "❌ Server Error:",
    err
  );

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message ||
      "Something went wrong on the server!",
  });
});

// =====================================================
// LOCAL SERVER
// =====================================================
//
// Vercel automatically handles the Express app.
// app.listen() is used only for local development.
// =====================================================

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `🚀 Backend server running at http://localhost:${PORT}`
    );
  });
}

// =====================================================
// EXPORT APP
// =====================================================
//
// Required for Vercel.
// =====================================================

module.exports = app;
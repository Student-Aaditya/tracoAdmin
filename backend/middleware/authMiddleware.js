const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token failed" });
  }
};


const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Access denied: SuperAdmin only" });
  }
  next();
};

const isSuperAdminorAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin" && req.user.role !== "admin") {
    return res.status(404).json({ message: "Access denied: SuperAdmin or admin only" });
  }
  next();
};

module.exports = { protect, isSuperAdmin ,isSuperAdminorAdmin};
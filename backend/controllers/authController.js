const db = require("../db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const registerSuperAdmin = (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  
  db.query("SELECT * FROM users WHERE role = 'superadmin'")
    .then(([rows]) => {
      if (rows.length > 0) {
        return res.status(400).json({ message: "SuperAdmin already exists" });
      }

      return bcrypt.hash(password, 10).then((hashedPassword) => {
        const sql =
          "INSERT INTO users (name, username, password, role, created_by) VALUES (?, ?, ?, 'super_admin', 'super_admin')";

        return db
          .query(sql, [name, username, hashedPassword])
          .then(() => {
            res.status(201).json({ message: "SuperAdmin registered successfully" });
          });
      });
    })
    .catch((err) => {
      console.error("Error registering superadmin:", err);
      res.status(500).json({ message: "Server error" });
    });
};

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.query("SELECT * FROM users WHERE username = ?", [username])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      const user = rows[0];

      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid username or password" });
        }

       
        const token = generateToken(user.id, user.role);

        res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          },
        });
      });
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    });
};

module.exports = { registerSuperAdmin, login };
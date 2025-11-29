const db = require("../db");
const bcrypt = require("bcrypt");

const addAdmin = (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE username = ?", [username])
    .then(([rows]) => {
      if (rows.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      return bcrypt.hash(password, 10).then((hashedPassword) => {
        const sql =
          "INSERT INTO users (name, username, password, role, created_by,activeStatus) VALUES (?, ?, ?, 'admin', 'super_admin','Active')";
        return db.query(sql, [name, username, hashedPassword]);
      });
    })
    .then(() => res.json({ message: "Admin created successfully" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    });
};


const getAdmins = (req, res) => {
  db.query("SELECT id, name, username, role,activeStatus FROM users WHERE role = 'admin'")
    .then(([rows]) => res.json(rows))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    });
};


const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    let hashedPwd = rows[0].password; 
    if (password) {
      hashedPwd = await bcrypt.hash(password, 10);
    }

    await db.query(
      "UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?",
      [name, username, hashedPwd, id]
    );

    return res.status(200).json({ msg: "Vendor details updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const updateStatus=(req,res)=>{
  const {id}=req.params;
  const query="UPDATE users  SET activeStatus='Blocked'WHERE id=?";
  db.query(query,[id]).then(()=>{
    return res.status(200).json({msg:"Admin Blocked Successfully"});
  }).catch((err)=>{
    console.log(err);
  })
}

const deleteAdmin = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ? AND role = 'admin'", [id])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.json({ message: "Admin deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    });
};

module.exports = { addAdmin, getAdmins,updateAdmin,updateStatus, deleteAdmin };
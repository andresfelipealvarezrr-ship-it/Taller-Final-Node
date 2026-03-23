const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");

// GET /api/usuarios
router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM usuarios ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT id, nombre, email, rol, activo, created_at FROM usuarios ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, total: count.total, page: parseInt(page), limit: parseInt(limit), data: rows });
      }
    );
  });
});

// GET /api/usuarios/:id
router.get("/:id", (req, res) => {
  db.get("SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, data: row });
  });
});

// POST /api/usuarios
router.post("/", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: "nombre, email y password son obligatorios" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Email inválido" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "La contraseña debe tener mínimo 6 caracteres" });
  }
  if (rol && !["admin", "medico"].includes(rol)) {
    return res.status(400).json({ success: false, message: "rol debe ser 'admin' o 'medico'" });
  }

  db.get("SELECT id FROM usuarios WHERE email = ?", [email], async (err, existe) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: "Ya existe un usuario con ese email" });

    const hash = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre.trim(), email.trim(), hash, rol || "medico"],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Usuario creado", data: { id: this.lastID, nombre, email, rol: rol || "medico" } });
      }
    );
  });
});

// PUT /api/usuarios/:id
router.put("/:id", async (req, res) => {
  const { nombre, email, password, rol, activo } = req.body;

  db.get("SELECT * FROM usuarios WHERE id = ?", [req.params.id], async (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const newNombre = nombre ?? row.nombre;
    const newEmail = email ?? row.email;
    const newRol = rol ?? row.rol;
    const newActivo = activo !== undefined ? activo : row.activo;
    const newPassword = password ? await bcrypt.hash(password, 10) : row.password;

    db.run(
      "UPDATE usuarios SET nombre = ?, email = ?, password = ?, rol = ?, activo = ? WHERE id = ?",
      [newNombre, newEmail, newPassword, newRol, newActivo, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Usuario actualizado", data: { id: parseInt(req.params.id), nombre: newNombre, email: newEmail, rol: newRol } });
      }
    );
  });
});

// DELETE /api/usuarios/:id
router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM usuarios WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    db.run("DELETE FROM usuarios WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Usuario eliminado" });
    });
  });
});

module.exports = router;

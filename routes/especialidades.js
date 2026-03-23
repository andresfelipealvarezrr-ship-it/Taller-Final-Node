const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/especialidades — con filtro dinámico y paginación
router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`${key} LIKE ?`);
    params.push(`%${value}%`);
  });

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM especialidades ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    db.all(
      `SELECT * FROM especialidades ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({
          success: true,
          total: count.total,
          page: parseInt(page),
          limit: parseInt(limit),
          data: rows,
        });
      }
    );
  });
});

// GET /api/especialidades/:id
router.get("/:id", (req, res) => {
  db.get("SELECT * FROM especialidades WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Especialidad no encontrada" });
    res.json({ success: true, data: row });
  });
});

// POST /api/especialidades
router.post("/", (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ success: false, message: "nombre y descripcion son obligatorios" });
  }
  if (typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({ success: false, message: "nombre debe ser texto válido" });
  }

  db.get("SELECT id FROM especialidades WHERE nombre = ?", [nombre.trim()], (err, existe) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: "Ya existe una especialidad con ese nombre" });

    db.run(
      "INSERT INTO especialidades (nombre, descripcion) VALUES (?, ?)",
      [nombre.trim(), descripcion.trim()],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Especialidad creada", data: { id: this.lastID, nombre, descripcion } });
      }
    );
  });
});

// PUT /api/especialidades/:id
router.put("/:id", (req, res) => {
  const { nombre, descripcion, activo } = req.body;

  db.get("SELECT * FROM especialidades WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Especialidad no encontrada" });

    const newNombre = nombre ?? row.nombre;
    const newDescripcion = descripcion ?? row.descripcion;
    const newActivo = activo !== undefined ? activo : row.activo;

    db.run(
      "UPDATE especialidades SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?",
      [newNombre, newDescripcion, newActivo, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Especialidad actualizada", data: { id: parseInt(req.params.id), nombre: newNombre, descripcion: newDescripcion, activo: newActivo } });
      }
    );
  });
});

// DELETE /api/especialidades/:id
router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM especialidades WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Especialidad no encontrada" });

    db.run("DELETE FROM especialidades WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Especialidad eliminada" });
    });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM medicamentos ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT * FROM medicamentos ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, total: count.total, page: parseInt(page), limit: parseInt(limit), data: rows });
      }
    );
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM medicamentos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Medicamento no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { nombre, principio, presentacion, stock } = req.body;
  if (!nombre || !principio || !presentacion) {
    return res.status(400).json({ success: false, message: "nombre, principio y presentacion son obligatorios" });
  }
  if (stock !== undefined && (isNaN(stock) || parseInt(stock) < 0)) {
    return res.status(400).json({ success: false, message: "stock debe ser un número mayor o igual a 0" });
  }

  db.get("SELECT id FROM medicamentos WHERE nombre = ?", [nombre.trim()], (err, existe) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: "Ya existe un medicamento con ese nombre" });

    db.run(
      "INSERT INTO medicamentos (nombre, principio, presentacion, stock) VALUES (?, ?, ?, ?)",
      [nombre.trim(), principio.trim(), presentacion.trim(), stock ?? 0],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Medicamento creado", data: { id: this.lastID, nombre, principio, presentacion } });
      }
    );
  });
});

router.put("/:id", (req, res) => {
  const { nombre, principio, presentacion, stock, activo } = req.body;
  db.get("SELECT * FROM medicamentos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Medicamento no encontrado" });

    db.run(
      "UPDATE medicamentos SET nombre=?, principio=?, presentacion=?, stock=?, activo=? WHERE id=?",
      [nombre??row.nombre, principio??row.principio, presentacion??row.presentacion,
       stock??row.stock, activo!==undefined?activo:row.activo, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Medicamento actualizado" });
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM medicamentos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Medicamento no encontrado" });

    db.run("DELETE FROM medicamentos WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Medicamento eliminado" });
    });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");

const TIPOS_DOC = ["CC", "TI", "CE", "PA"];

router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM pacientes ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT * FROM pacientes ${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, total: count.total, page: parseInt(page), limit: parseInt(limit), data: rows });
      }
    );
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Paciente no encontrado" });
    res.json({ success: true, data: row });
  });
});

router.post("/", (req, res) => {
  const { nombre, documento, tipo_documento, fecha_nacimiento, telefono, email, direccion } = req.body;

  if (!nombre || !documento || !tipo_documento || !fecha_nacimiento || !telefono || !direccion) {
    return res.status(400).json({ success: false, message: "nombre, documento, tipo_documento, fecha_nacimiento, telefono y direccion son obligatorios" });
  }
  if (!TIPOS_DOC.includes(tipo_documento)) {
    return res.status(400).json({ success: false, message: `tipo_documento debe ser: ${TIPOS_DOC.join(", ")}` });
  }
  if (isNaN(Date.parse(fecha_nacimiento))) {
    return res.status(400).json({ success: false, message: "fecha_nacimiento no es una fecha válida (YYYY-MM-DD)" });
  }

  db.get("SELECT id FROM pacientes WHERE documento = ?", [documento], (err, existe) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: "Ya existe un paciente con ese documento" });

    db.run(
      "INSERT INTO pacientes (nombre, documento, tipo_documento, fecha_nacimiento, telefono, email, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre.trim(), documento, tipo_documento, fecha_nacimiento, telefono, email || null, direccion.trim()],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Paciente creado", data: { id: this.lastID, nombre, documento } });
      }
    );
  });
});

router.put("/:id", (req, res) => {
  const { nombre, documento, tipo_documento, fecha_nacimiento, telefono, email, direccion, activo } = req.body;

  db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Paciente no encontrado" });

    if (tipo_documento && !TIPOS_DOC.includes(tipo_documento)) {
      return res.status(400).json({ success: false, message: `tipo_documento debe ser: ${TIPOS_DOC.join(", ")}` });
    }

    db.run(
      "UPDATE pacientes SET nombre=?, documento=?, tipo_documento=?, fecha_nacimiento=?, telefono=?, email=?, direccion=?, activo=? WHERE id=?",
      [nombre??row.nombre, documento??row.documento, tipo_documento??row.tipo_documento,
       fecha_nacimiento??row.fecha_nacimiento, telefono??row.telefono, email??row.email,
       direccion??row.direccion, activo!==undefined?activo:row.activo, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Paciente actualizado" });
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Paciente no encontrado" });

    db.run("DELETE FROM pacientes WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Paciente eliminado" });
    });
  });
});

module.exports = router;

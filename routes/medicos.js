const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/medicos
router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`m.${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM medicos m ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT m.*, e.nombre as especialidad
       FROM medicos m
       JOIN especialidades e ON m.especialidad_id = e.id
       ${whereClause} ORDER BY m.nombre ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, total: count.total, page: parseInt(page), limit: parseInt(limit), data: rows });
      }
    );
  });
});

// GET /api/medicos/:id
router.get("/:id", (req, res) => {
  db.get(
    `SELECT m.*, e.nombre as especialidad
     FROM medicos m
     JOIN especialidades e ON m.especialidad_id = e.id
     WHERE m.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!row) return res.status(404).json({ success: false, message: "Médico no encontrado" });
      res.json({ success: true, data: row });
    }
  );
});

// POST /api/medicos
router.post("/", (req, res) => {
  const { nombre, email, password, especialidad_id, numero_licencia, telefono } = req.body;

  if (!nombre || !email || !password || !especialidad_id || !numero_licencia || !telefono) {
    return res.status(400).json({
      success: false,
      message: "nombre, email, password, especialidad_id, numero_licencia y telefono son obligatorios"
    });
  }
  if (isNaN(especialidad_id)) {
    return res.status(400).json({ success: false, message: "especialidad_id debe ser un número" });
  }

  db.get("SELECT id FROM especialidades WHERE id = ?", [especialidad_id], (err, esp) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!esp) return res.status(404).json({ success: false, message: "El especialidad_id no existe" });

    db.get("SELECT id FROM medicos WHERE numero_licencia = ?", [numero_licencia], (err, existe) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (existe) return res.status(400).json({ success: false, message: "Ya existe un médico con ese número de licencia" });

      db.get("SELECT id FROM medicos WHERE email = ?", [email], (err, emailExiste) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (emailExiste) return res.status(400).json({ success: false, message: "Ya existe un médico con ese email" });

        db.run(
          "INSERT INTO medicos (nombre, email, password, especialidad_id, numero_licencia, telefono) VALUES (?, ?, ?, ?, ?, ?)",
          [nombre, email, password, especialidad_id, numero_licencia, telefono],
          function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.status(201).json({
              success: true,
              message: "Médico creado",
              data: { id: this.lastID, nombre, email, especialidad_id, numero_licencia, telefono }
            });
          }
        );
      });
    });
  });
});

// PUT /api/medicos/:id
router.put("/:id", (req, res) => {
  const { nombre, email, password, especialidad_id, numero_licencia, telefono, activo } = req.body;

  db.get("SELECT * FROM medicos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Médico no encontrado" });

    const newNombre   = nombre          ?? row.nombre;
    const newEmail    = email           ?? row.email;
    const newPassword = password        ?? row.password;
    const newEsp      = especialidad_id ?? row.especialidad_id;
    const newLic      = numero_licencia ?? row.numero_licencia;
    const newTel      = telefono        ?? row.telefono;
    const newActivo   = activo !== undefined ? activo : row.activo;

    db.run(
      "UPDATE medicos SET nombre = ?, email = ?, password = ?, especialidad_id = ?, numero_licencia = ?, telefono = ?, activo = ? WHERE id = ?",
      [newNombre, newEmail, newPassword, newEsp, newLic, newTel, newActivo, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Médico actualizado" });
      }
    );
  });
});

// DELETE /api/medicos/:id
router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM medicos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Médico no encontrado" });

    db.run("DELETE FROM medicos WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Médico eliminado" });
    });
  });
});

module.exports = router;

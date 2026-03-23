const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`d.${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM diagnosticos d ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT d.*, m.nombre as medicamento, p.nombre as paciente
       FROM diagnosticos d
       JOIN citas c ON d.cita_id = c.id
       JOIN pacientes p ON c.paciente_id = p.id
       LEFT JOIN medicamentos m ON d.medicamento_id = m.id
       ${whereClause} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, total: count.total, page: parseInt(page), limit: parseInt(limit), data: rows });
      }
    );
  });
});

router.get("/:id", (req, res) => {
  db.get(
    `SELECT d.*, m.nombre as medicamento, p.nombre as paciente
     FROM diagnosticos d
     JOIN citas c ON d.cita_id = c.id
     JOIN pacientes p ON c.paciente_id = p.id
     LEFT JOIN medicamentos m ON d.medicamento_id = m.id
     WHERE d.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!row) return res.status(404).json({ success: false, message: "Diagnóstico no encontrado" });
      res.json({ success: true, data: row });
    }
  );
});

router.post("/", (req, res) => {
  const { cita_id, descripcion, tratamiento, medicamento_id, dosis } = req.body;

  if (!cita_id || !descripcion || !tratamiento) {
    return res.status(400).json({ success: false, message: "cita_id, descripcion y tratamiento son obligatorios" });
  }
  if (isNaN(cita_id)) {
    return res.status(400).json({ success: false, message: "cita_id debe ser un número" });
  }

  db.get("SELECT id FROM citas WHERE id = ?", [cita_id], (err, cita) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!cita) return res.status(404).json({ success: false, message: "El cita_id no existe" });

    const verificarMed = (cb) => {
      if (!medicamento_id) return cb();
      db.get("SELECT id FROM medicamentos WHERE id = ?", [medicamento_id], (err, med) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!med) return res.status(404).json({ success: false, message: "El medicamento_id no existe" });
        cb();
      });
    };

    verificarMed(() => {
      db.run(
        "INSERT INTO diagnosticos (cita_id, descripcion, tratamiento, medicamento_id, dosis) VALUES (?, ?, ?, ?, ?)",
        [cita_id, descripcion.trim(), tratamiento.trim(), medicamento_id || null, dosis || null],
        function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: "Diagnóstico creado", data: { id: this.lastID, cita_id, descripcion } });
        }
      );
    });
  });
});

router.put("/:id", (req, res) => {
  const { descripcion, tratamiento, medicamento_id, dosis } = req.body;

  db.get("SELECT * FROM diagnosticos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Diagnóstico no encontrado" });

    db.run(
      "UPDATE diagnosticos SET descripcion=?, tratamiento=?, medicamento_id=?, dosis=? WHERE id=?",
      [descripcion??row.descripcion, tratamiento??row.tratamiento,
       medicamento_id??row.medicamento_id, dosis??row.dosis, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Diagnóstico actualizado" });
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM diagnosticos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Diagnóstico no encontrado" });

    db.run("DELETE FROM diagnosticos WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Diagnóstico eliminado" });
    });
  });
});

module.exports = router;

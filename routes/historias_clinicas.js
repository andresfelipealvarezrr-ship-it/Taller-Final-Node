const express = require("express");
const router = express.Router();
const db = require("../db");

const TIPOS_SANGRE = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`h.${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM historias_clinicas h ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT h.*, p.nombre as paciente, p.documento
       FROM historias_clinicas h
       JOIN pacientes p ON h.paciente_id = p.id
       ${whereClause} ORDER BY h.updated_at DESC LIMIT ? OFFSET ?`,
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
    `SELECT h.*, p.nombre as paciente, p.documento
     FROM historias_clinicas h
     JOIN pacientes p ON h.paciente_id = p.id
     WHERE h.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!row) return res.status(404).json({ success: false, message: "Historia clínica no encontrada" });
      res.json({ success: true, data: row });
    }
  );
});

router.post("/", (req, res) => {
  const { paciente_id, tipo_sangre, alergias, antecedentes, observaciones } = req.body;

  if (!paciente_id || !tipo_sangre) {
    return res.status(400).json({ success: false, message: "paciente_id y tipo_sangre son obligatorios" });
  }
  if (!TIPOS_SANGRE.includes(tipo_sangre)) {
    return res.status(400).json({ success: false, message: `tipo_sangre debe ser: ${TIPOS_SANGRE.join(", ")}` });
  }

  db.get("SELECT id FROM pacientes WHERE id = ?", [paciente_id], (err, paciente) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!paciente) return res.status(404).json({ success: false, message: "El paciente_id no existe" });

    db.run(
      "INSERT INTO historias_clinicas (paciente_id, tipo_sangre, alergias, antecedentes, observaciones) VALUES (?, ?, ?, ?, ?)",
      [paciente_id, tipo_sangre, alergias || "Ninguna", antecedentes || "Ninguno", observaciones || null],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: "Historia clínica creada", data: { id: this.lastID, paciente_id, tipo_sangre } });
      }
    );
  });
});

router.put("/:id", (req, res) => {
  const { tipo_sangre, alergias, antecedentes, observaciones } = req.body;

  if (tipo_sangre && !TIPOS_SANGRE.includes(tipo_sangre)) {
    return res.status(400).json({ success: false, message: `tipo_sangre debe ser: ${TIPOS_SANGRE.join(", ")}` });
  }

  db.get("SELECT * FROM historias_clinicas WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Historia clínica no encontrada" });

    db.run(
      "UPDATE historias_clinicas SET tipo_sangre=?, alergias=?, antecedentes=?, observaciones=?, updated_at=datetime('now') WHERE id=?",
      [tipo_sangre??row.tipo_sangre, alergias??row.alergias,
       antecedentes??row.antecedentes, observaciones??row.observaciones, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Historia clínica actualizada" });
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM historias_clinicas WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Historia clínica no encontrada" });

    db.run("DELETE FROM historias_clinicas WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Historia clínica eliminada" });
    });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");

const ESTADOS = ["programada", "atendida", "cancelada"];

router.get("/", (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = [], params = [];

  Object.entries(filters).forEach(([key, value]) => {
    where.push(`c.${key} LIKE ?`);
    params.push(`%${value}%`);
  });
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.get(`SELECT COUNT(*) as total FROM citas c ${whereClause}`, params, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    db.all(
      `SELECT c.*, p.nombre as paciente, u.nombre as medico
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       JOIN medicos m ON c.medico_id = m.id
       ${whereClause} ORDER BY c.fecha DESC, c.hora ASC LIMIT ? OFFSET ?`,
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
    `SELECT c.*, p.nombre as paciente, u.nombre as medico
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     JOIN medicos m ON c.medico_id = m.id
     JOIN usuarios u ON m.usuario_id = u.id
     WHERE c.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!row) return res.status(404).json({ success: false, message: "Cita no encontrada" });
      res.json({ success: true, data: row });
    }
  );
});

router.post("/", (req, res) => {
  const { paciente_id, medico_id, fecha, hora, motivo } = req.body;

  if (!paciente_id || !medico_id || !fecha || !hora || !motivo) {
    return res.status(400).json({ success: false, message: "paciente_id, medico_id, fecha, hora y motivo son obligatorios" });
  }
  if (isNaN(paciente_id) || isNaN(medico_id)) {
    return res.status(400).json({ success: false, message: "paciente_id y medico_id deben ser números" });
  }
  if (isNaN(Date.parse(fecha))) {
    return res.status(400).json({ success: false, message: "fecha no válida (YYYY-MM-DD)" });
  }

  db.get("SELECT id FROM pacientes WHERE id = ?", [paciente_id], (err, p) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!p) return res.status(404).json({ success: false, message: "El paciente_id no existe" });

    db.get("SELECT id FROM medicos WHERE id = ?", [medico_id], (err, m) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (!m) return res.status(404).json({ success: false, message: "El medico_id no existe" });

      db.run(
        "INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo) VALUES (?, ?, ?, ?, ?)",
        [paciente_id, medico_id, fecha, hora, motivo.trim()],
        function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: "Cita creada", data: { id: this.lastID, paciente_id, medico_id, fecha, hora, motivo } });
        }
      );
    });
  });
});

router.put("/:id", (req, res) => {
  const { fecha, hora, motivo, estado } = req.body;

  if (estado && !ESTADOS.includes(estado)) {
    return res.status(400).json({ success: false, message: `estado debe ser: ${ESTADOS.join(", ")}` });
  }

  db.get("SELECT * FROM citas WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Cita no encontrada" });

    db.run(
      "UPDATE citas SET fecha=?, hora=?, motivo=?, estado=? WHERE id=?",
      [fecha??row.fecha, hora??row.hora, motivo??row.motivo, estado??row.estado, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Cita actualizada" });
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM citas WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: "Cita no encontrada" });

    db.run("DELETE FROM citas WHERE id = ?", [req.params.id], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Cita eliminada" });
    });
  });
});

module.exports = router;

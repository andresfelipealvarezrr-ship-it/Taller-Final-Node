require("dotenv").config();
const express = require("express");
const db = require("./db");

// ─── Validación de variables de entorno obligatorias ───────────────────────
if (!process.env.PORT || !process.env.API_PASSWORD) {
  console.error("❌ Faltan variables de entorno: PORT o API_PASSWORD");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ───────────────────────────────────────────────────
app.use(express.json());

// ─── Middleware de autenticación simple (como pide la guía) ────────────────
app.use((req, res, next) => {
  if (req.path === "/health") return next();

  const password = req.headers["password"];

  if (!password) {
    return res.status(401).json({
      success: false,
      message: "Acceso denegado. Incluye el header: password: <tu_password>",
    });
  }

  if (password !== process.env.API_PASSWORD) {
    return res.status(403).json({
      success: false,
      message: "Contraseña incorrecta",
    });
  }

  next();
});

// ─── Endpoint de salud ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Sistema Hospitalario API funcionando",
    uptime: process.uptime().toFixed(2) + "s",
    timestamp: new Date().toISOString(),
  });
});

// ─── Rutas ─────────────────────────────────────────────────────────────────
app.use("/api/especialidades",     require("./routes/especialidades"));
app.use("/api/medicos",            require("./routes/medicos"));
app.use("/api/pacientes",          require("./routes/pacientes"));
app.use("/api/citas",              require("./routes/citas"));
app.use("/api/medicamentos",       require("./routes/medicamentos"));
app.use("/api/diagnosticos",       require("./routes/diagnosticos"));
app.use("/api/historias-clinicas", require("./routes/historias_clinicas"));

// ─── Manejo centralizado de errores ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error interno:", err.message);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ─── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Autenticación: password en header activa`);
});

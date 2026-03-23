const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "database.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
  } else {
    console.log("✅ Conectado a SQLite correctamente");
  }
});

// Habilitar foreign keys en SQLite
db.run("PRAGMA foreign_keys = ON");

db.serialize(() => {
  // ─────────────────────────────────────────
  // TABLA 1: especialidades
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS especialidades (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL UNIQUE,
      descripcion TEXT    NOT NULL,
      activo      INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 2: usuarios  (para JWT login)
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre     TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      rol        TEXT    NOT NULL DEFAULT 'medico' CHECK(rol IN ('admin', 'medico')),
      activo     INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 3: medicos
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS medicos (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id       INTEGER NOT NULL UNIQUE,
      especialidad_id  INTEGER NOT NULL,
      numero_licencia  TEXT    NOT NULL UNIQUE,
      telefono         TEXT    NOT NULL,
      activo           INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id)      REFERENCES usuarios(id)      ON DELETE CASCADE,
      FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE RESTRICT
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 4: pacientes
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre           TEXT    NOT NULL,
      documento        TEXT    NOT NULL UNIQUE,
      tipo_documento   TEXT    NOT NULL CHECK(tipo_documento IN ('CC', 'TI', 'CE', 'PA')),
      fecha_nacimiento TEXT    NOT NULL,
      telefono         TEXT    NOT NULL,
      email            TEXT    UNIQUE,
      direccion        TEXT    NOT NULL,
      activo           INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 5: citas
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS citas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      medico_id   INTEGER NOT NULL,
      fecha       TEXT    NOT NULL,
      hora        TEXT    NOT NULL,
      motivo      TEXT    NOT NULL,
      estado      TEXT    NOT NULL DEFAULT 'programada' CHECK(estado IN ('programada', 'atendida', 'cancelada')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
      FOREIGN KEY (medico_id)   REFERENCES medicos(id)   ON DELETE RESTRICT
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 6: medicamentos
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS medicamentos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT    NOT NULL UNIQUE,
      principio    TEXT    NOT NULL,
      presentacion TEXT    NOT NULL,
      stock        INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      activo       INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 7: diagnosticos
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS diagnosticos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cita_id         INTEGER NOT NULL UNIQUE,
      descripcion     TEXT    NOT NULL,
      tratamiento     TEXT    NOT NULL,
      medicamento_id  INTEGER,
      dosis           TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (cita_id)        REFERENCES citas(id)        ON DELETE CASCADE,
      FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE SET NULL
    )
  `);

  // ─────────────────────────────────────────
  // TABLA 8: historias_clinicas
  // ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS historias_clinicas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id     INTEGER NOT NULL UNIQUE,
      tipo_sangre     TEXT    NOT NULL CHECK(tipo_sangre IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
      alergias        TEXT    NOT NULL DEFAULT 'Ninguna',
      antecedentes    TEXT    NOT NULL DEFAULT 'Ninguno',
      observaciones   TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creando tablas:", err.message);
    } else {
      console.log("✅ 8 tablas creadas correctamente");
    }
  });
});

module.exports = db;
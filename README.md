# 🏥 Sistema Hospitalario API

API REST completa para gestión hospitalaria construida con Node.js, Express y SQLite.

---

## 🌐 URL en Producción

```
https://taller-final-node.onrender.com
```

## 🔐 Autenticación

Todas las rutas requieren el siguiente header en cada petición:

```
password: TuPasswordSegura2024
```

---

## 🗄️ Modelo de Datos (Diagrama ER)

El sistema tiene 8 tablas relacionadas entre sí:

```
especialidades ←── medicos ←── citas ──→ pacientes
                                │              │
                           diagnosticos   historias_clinicas
                                │
                           medicamentos

usuarios ──→ medicos
```

### Tablas y su función

| Tabla | ¿Para qué sirve? |
|-------|-----------------|
| `especialidades` | Catálogo de especialidades médicas (Cardiología, Pediatría...) |
| `usuarios` | Personas que usan el sistema (médicos y admins) |
| `medicos` | Une un usuario con una especialidad |
| `pacientes` | Datos de los pacientes del hospital |
| `citas` | Cita entre un paciente y un médico |
| `medicamentos` | Catálogo de medicamentos disponibles |
| `diagnosticos` | Resultado médico de una cita |
| `historias_clinicas` | Historial médico completo de un paciente |

---

## 📡 Endpoints

Todas las rutas requieren el header `password: TuPasswordSegura2024`

### 🏥 Especialidades `/api/especialidades`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/especialidades | Obtener todas las especialidades |
| GET | /api/especialidades/:id | Obtener una especialidad por ID |
| POST | /api/especialidades | Crear una especialidad |
| PUT | /api/especialidades/:id | Actualizar una especialidad |
| DELETE | /api/especialidades/:id | Eliminar una especialidad |

**Ejemplo POST:**
```json
{
  "nombre": "Cardiología",
  "descripcion": "Especialidad del corazón y sistema cardiovascular"
}
```

---

### 👤 Usuarios `/api/usuarios`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/usuarios | Obtener todos los usuarios |
| GET | /api/usuarios/:id | Obtener un usuario por ID |
| POST | /api/usuarios | Crear un usuario |
| PUT | /api/usuarios/:id | Actualizar un usuario |
| DELETE | /api/usuarios/:id | Eliminar un usuario |

**Ejemplo POST:**
```json
{
  "nombre": "Dr. Juan Pérez",
  "email": "juan.perez@hospital.com",
  "password": "medico123",
  "rol": "medico"
}
```

---

### 👨‍⚕️ Médicos `/api/medicos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/medicos | Obtener todos los médicos |
| GET | /api/medicos/:id | Obtener un médico por ID |
| POST | /api/medicos | Crear un médico |
| PUT | /api/medicos/:id | Actualizar un médico |
| DELETE | /api/medicos/:id | Eliminar un médico |

**Ejemplo POST:**
```json
{
  "usuario_id": 1,
  "especialidad_id": 1,
  "numero_licencia": "MED-001",
  "telefono": "3001234567"
}
```

---

### 🧑‍🤝‍🧑 Pacientes `/api/pacientes`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/pacientes | Obtener todos los pacientes |
| GET | /api/pacientes/:id | Obtener un paciente por ID |
| POST | /api/pacientes | Crear un paciente |
| PUT | /api/pacientes/:id | Actualizar un paciente |
| DELETE | /api/pacientes/:id | Eliminar un paciente |

**Ejemplo POST:**
```json
{
  "nombre": "Ana Martínez",
  "documento": "1023456789",
  "tipo_documento": "CC",
  "fecha_nacimiento": "1990-05-15",
  "telefono": "3111234567",
  "email": "ana.martinez@gmail.com",
  "direccion": "Calle 10 #5-20 Bogotá"
}
```

---

### 📅 Citas `/api/citas`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/citas | Obtener todas las citas |
| GET | /api/citas/:id | Obtener una cita por ID |
| POST | /api/citas | Crear una cita |
| PUT | /api/citas/:id | Actualizar una cita |
| DELETE | /api/citas/:id | Eliminar una cita |

**Ejemplo POST:**
```json
{
  "paciente_id": 1,
  "medico_id": 1,
  "fecha": "2024-12-01",
  "hora": "08:00",
  "motivo": "Dolor en el pecho"
}
```

---

### 💊 Medicamentos `/api/medicamentos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/medicamentos | Obtener todos los medicamentos |
| GET | /api/medicamentos/:id | Obtener un medicamento por ID |
| POST | /api/medicamentos | Crear un medicamento |
| PUT | /api/medicamentos/:id | Actualizar un medicamento |
| DELETE | /api/medicamentos/:id | Eliminar un medicamento |

**Ejemplo POST:**
```json
{
  "nombre": "Ibuprofeno 400mg",
  "principio": "Ibuprofeno",
  "presentacion": "Tabletas",
  "stock": 100
}
```

---

### 🩺 Diagnósticos `/api/diagnosticos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/diagnosticos | Obtener todos los diagnósticos |
| GET | /api/diagnosticos/:id | Obtener un diagnóstico por ID |
| POST | /api/diagnosticos | Crear un diagnóstico |
| PUT | /api/diagnosticos/:id | Actualizar un diagnóstico |
| DELETE | /api/diagnosticos/:id | Eliminar un diagnóstico |

**Ejemplo POST:**
```json
{
  "cita_id": 1,
  "descripcion": "Arritmia leve detectada",
  "tratamiento": "Reposo y medicación",
  "medicamento_id": 1,
  "dosis": "1 tableta cada 8 horas"
}
```

---

### 📁 Historias Clínicas `/api/historias-clinicas`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/historias-clinicas | Obtener todas las historias |
| GET | /api/historias-clinicas/:id | Obtener una historia por ID |
| POST | /api/historias-clinicas | Crear una historia clínica |
| PUT | /api/historias-clinicas/:id | Actualizar una historia clínica |
| DELETE | /api/historias-clinicas/:id | Eliminar una historia clínica |

**Ejemplo POST:**
```json
{
  "paciente_id": 1,
  "tipo_sangre": "O+",
  "alergias": "Penicilina",
  "antecedentes": "Hipertensión familiar",
  "observaciones": "Paciente con control mensual"
}
```

---

## 🔍 Filtros y Paginación

Todos los endpoints GET de lista soportan filtros dinámicos y paginación:

```
GET /api/pacientes?nombre=Ana
GET /api/citas?estado=programada
GET /api/especialidades?page=1&limit=5
```

---

## ⚙️ Correr el proyecto localmente

### Requisitos
- Node.js v18 o superior
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/sistema-hospitalario-api.git

# 2. Entrar a la carpeta
cd sistema-hospitalario-api

# 3. Instalar dependencias
npm install

# 4. Crear el archivo .env
# Crea un archivo llamado .env con este contenido:
PORT=3000
API_PASSWORD=TuPasswordSegura2024
NODE_ENV=development

# 5. Iniciar en desarrollo
npm run dev

# 6. Verificar que funciona
# Abre en el navegador: http://localhost:3000/health
```

---

## 🛠️ Tecnologías utilizadas

| Tecnología | ¿Para qué? |
|-----------|-----------|
| Node.js | Entorno de ejecución JavaScript |
| Express | Framework para crear la API |
| SQLite3 | Base de datos ligera en archivo |
| dotenv | Variables de entorno |
| bcryptjs | Encriptación de contraseñas |
| nodemon | Reinicio automático en desarrollo |

---

## 📂 Estructura del proyecto

```
sistema-hospitalario-api/
├── index.js              ← Servidor principal
├── db.js                 ← Conexión y creación de tablas
├── .env                  ← Variables de entorno (no subir a GitHub)
├── .gitignore            ← Archivos ignorados por git
├── package.json          ← Dependencias del proyecto
└── routes/
    ├── especialidades.js
    ├── usuarios.js
    ├── medicos.js
    ├── pacientes.js
    ├── citas.js
    ├── medicamentos.js
    ├── diagnosticos.js
    └── historias_clinicas.js
```

---

## 👨‍💻 Autor

**Andres Alvarez**  
Programa: Análisis y Desarrollo de Software  
SENA — 2026

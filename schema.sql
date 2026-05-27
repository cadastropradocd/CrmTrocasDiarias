DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departamentos;
DROP TABLE IF EXISTS trocas_dias;
DROP TABLE IF EXISTS registros;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE NOT NULL,
    meta REAL NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trocas_dias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria TEXT NOT NULL,
    realizado REAL NOT NULL DEFAULT 0,
    meta REAL NOT NULL DEFAULT 0,
    trocas_dia_id INTEGER NOT NULL,
    departamento_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (trocas_dia_id) REFERENCES trocas_dias(id),
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE INDEX idx_registros_trocas_dia_id ON registros(trocas_dia_id);
CREATE INDEX idx_registros_departamento_id ON registros(departamento_id);
CREATE INDEX idx_trocas_dias_data ON trocas_dias(data);
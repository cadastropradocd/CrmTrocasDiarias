-- Users (password: admin123 for admin, user123 for user1)
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2b$10$0vV2mrDYD0xC4lycoADbd.KAPwwK2Xqa8DqPyjYs15XLTlH9oh3Pa', 'Administrador', 'ADMIN'),
('user1', '$2b$10$0vV2mrDYD0xC4lycoADbd.KAPwwK2Xqa8DqPyjYs15XLTlH9oh3Pa', 'Usuario Teste', 'USER');

-- Departamentos
INSERT INTO departamentos (nome, meta, ativo) VALUES
('Departamento A', 100, 1),
('Departamento B', 150, 1),
('Departamento C', 120, 1);
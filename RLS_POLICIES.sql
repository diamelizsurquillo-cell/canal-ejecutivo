-- ====================================================================
-- RECOMENDACIONES DE ROW LEVEL SECURITY (RLS) PARA ACADEMIC HUB
-- ====================================================================
-- Este archivo contiene las sentencias SQL recomendadas para configurar
-- Row Level Security (RLS) y políticas de acceso en la base de datos de Supabase.
-- Ejecuta este script en el Editor SQL de tu panel de Supabase.

-- Habilitar RLS en las tablas principales
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. TABLA: users (Usuarios / Docentes)
-- ==========================================

-- Permitir lectura pública de los perfiles de docentes activos
CREATE POLICY "Permitir lectura de docentes activos" ON users
    FOR SELECT
    USING (activo = true);

-- Permitir a usuarios autenticados leer todo
CREATE POLICY "Permitir select a autenticados" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Solo administradores pueden insertar, actualizar o eliminar usuarios
CREATE POLICY "Permitir CRUD completo a administradores" ON users
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (SELECT role FROM users WHERE email = auth.email()) = 'admin'
    );

-- ==========================================
-- 2. TABLA: courses (Cursos)
-- ==========================================

-- Permitir lectura pública de todos los cursos
CREATE POLICY "Permitir lectura publica de cursos" ON courses
    FOR SELECT
    USING (true);

-- Permitir CRUD completo de cursos a administradores
CREATE POLICY "Permitir CRUD de cursos a administradores" ON courses
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM users WHERE email = auth.email()) = 'admin'
    );

-- ==========================================
-- 3. TABLA: categories (Categorías)
-- ==========================================

-- Permitir lectura pública de categorías
CREATE POLICY "Permitir lectura publica de categorias" ON categories
    FOR SELECT
    USING (true);

-- Permitir CRUD de categorías a administradores
CREATE POLICY "Permitir CRUD de categorias a admin" ON categories
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM users WHERE email = auth.email()) = 'admin'
    );

-- ==========================================
-- 4. TABLA: enrollments (Matrículas)
-- ==========================================

-- Permitir a administradores realizar cualquier acción en matrículas
CREATE POLICY "Permitir todo en matriculas a admin" ON enrollments
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM users WHERE email = auth.email()) = 'admin'
    );

-- Permitir a docentes ver matrículas de sus propios cursos
CREATE POLICY "Permitir a docentes ver matriculas de sus cursos" ON enrollments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN users u ON c.docente_id = u.id
            WHERE c.id = enrollments.curso_id
            AND u.email = auth.email()
        )
    );

-- ==========================================
-- 5. TABLA: expenses (Gastos / Egresos)
-- ==========================================

-- Solo administradores pueden ver, crear o modificar gastos
CREATE POLICY "Permitir control de gastos solo a admin" ON expenses
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM users WHERE email = auth.email()) = 'admin'
    );

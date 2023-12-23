const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

// инициализация таблицы users
async function initializeUsersTable() {
    // создаёт таблицы
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL,
        salt TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        middle_name TEXT,
        role TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL UNIQUE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL UNIQUE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS classes_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupID INTEGER NOT NULL,
        subjectID INTEGER NOT NULL,
        type INTEGER NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        middle_name TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS classes_teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherID INTEGER NOT NULL,
        subjectID INTEGER NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_group INTEGER NOT NULL,
        class_teacher INTEGER NOT NULL,
        dayOfWeek INTEGER NOT NULL,
        pair INTEGER NOT NULL
    )`);

    // добавляет администратора
    const salt = await bcrypt.genSalt();
    db.run(`INSERT OR IGNORE INTO users (
        username, hashed_password, salt, first_name, last_name, middle_name, role
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
        'admin',
        await bcrypt.hash('password', salt),
        salt,
        'Иван',
        'Иванов',
        'Иванович',
        'admin'
    ]);
}
initializeUsersTable();

router.post('/signin', (req, res) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [req.body.username], async (err, row) => {
        // обработка ошибки
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка сервера:', err);
        } else if (!row) {
            // пользователь не найден
            res.redirect('/?error=notfound');
            // res.status(401).send('Пользователь не найден');
        } else if (!await bcrypt.compare(req.body.password, row['hashed_password'])) {
            // пароль не соответствует
            res.redirect('/?error=password');
            // res.status(401).send('Неверный пароль');
        } else {
            // успешная авторизация
            req.session.data = row;
            res.redirect('/');
        }
    })
})

router.post('/signout', (req, res) => {
    if (req.session.data) {
        req.session.data = undefined;
        res.redirect('/');
    }
})



// db.close();

module.exports = router;
const express = require('express');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

function getUserInitials(firstName, lastName, middleName = '') {
    return `${lastName} ${firstName[0] + '.'} ${ (middleName) ? (middleName[0] + '.') : '' }`;
}

const adminTabs = [
    { title: 'Пользователи', path: '/users', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' }
];


// users
router.get('/users', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'admin')) {
        res.render('404');
    } else {
        db.all('SELECT first_name, last_name, middle_name, role, username from users', async (err, rows) => {
            if (err) { return []; }

            res.render('index', {
                name: getUserInitials(
                    req.session.data['first_name'],
                    req.session.data['last_name'],
                    req.session.data['middle_name']
                ),
                role: req.session.data.role,
                tabs: adminTabs,
                path: req.url,
                title: 'Дисциплины',
                data: rows,
                viewPath: 'pages/admin/users'
            })
        })
    }
})

// добавление пользователя в базу данных
router.post('/users/add', async (req, res) => {
    if (req?.session?.data?.role == 'admin') {
        db.all(`SELECT * from users WHERE username = '${req.body.username}'`, async (err, rows) => {
            if (rows?.length != 0) {
                res.redirect('/users/?error=duplicate');
                return;
            }
            const salt = await bcrypt.genSalt();
            db.run(`INSERT OR IGNORE INTO users (
                username, hashed_password, salt, first_name, last_name, middle_name, role
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.body.username,
                await bcrypt.hash(req.body.password, salt),
                salt,
                req.body.firstName,
                req.body.lastName,
                req.body.middleName || '',
                req.body.role
            ],
            () => {
                res.redirect('/users');
            });

        })
    }
});

// удаление пользователей из базы данных
router.post('/users/delete', async (req, res) => {

    db.run(`DELETE FROM users WHERE username = '${req.body.username}';`, (err) => {
        res.redirect('/users');
    });
})



module.exports = router;
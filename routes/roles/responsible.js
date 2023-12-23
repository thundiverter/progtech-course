const express = require('express');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

function getUserInitials(firstName, lastName, middleName = '') {
    return `${lastName} ${firstName[0] + '.'} ${ (middleName) ? (middleName[0] + '.') : '' }`;
}

const responsibleTabs = [
    { title: 'Преподаватели', path: '/teachers', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { title: 'Занятия', path: '/classes-teachers', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' }
];


// teachers
router.get('/teachers', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'responsible')) {
        res.render('404');
    } else {
        db.all('SELECT * from teachers', async (err, rows) => {
            if (err) { return []; }

            res.render('index', {
                name: getUserInitials(
                    req.session.data['first_name'],
                    req.session.data['last_name'],
                    req.session.data['middle_name']
                ),
                role: req.session.data.role,
                tabs: responsibleTabs,
                path: req.url,
                title: 'Преподаватели',
                data: rows,
                viewPath: 'pages/responsible/teachers'
            })
        })
    }
})
// classes
router.get('/classes-teachers', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'responsible')) {
        res.render('404');
    } else {
        db.all('SELECT * from classes_teachers', async (err, rows) => {
            if (err) { return []; }
            db.all('SELECT * from teachers ORDER BY middle_name ASC', async (err, rows2) => {
                if (err) { return []; }
                db.all('SELECT * from subjects ORDER BY title ASC', async (err, rows3) => {
                    if (err) { return []; }
                    res.render('index', {
                        name: getUserInitials(
                            req.session.data['first_name'],
                            req.session.data['last_name'],
                            req.session.data['middle_name']
                        ),
                        role: req.session.data.role,
                        tabs: responsibleTabs,
                        path: req.url,
                        title: 'Занятия',
                        data: [rows, rows2, rows3],
                        viewPath: 'pages/responsible/classes'
                    })
                })
            })
        })
    }
})

// добавление преподавателя в базу данных
router.post('/teachers/add', async (req, res) => {
    if (req.session.data.role == 'responsible') {
        db.all('SELECT * FROM teachers', async (err, rows) => {
            if (err) { return []; }
            let flag = true;
            for (let row of rows) {
                if (row.first_name == req.body.firstName && row.last_name == req.body.lastName && row.middle_name == req.body.middleName) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                db.run(`INSERT OR IGNORE INTO teachers (
                    first_name, last_name, middle_name
                ) VALUES (?, ?, ?)`,
                [
                    req.body.firstName,
                    req.body.lastName,
                    req.body.middleName || ''
                ],
                () => {
                    res.redirect('/teachers')
                })
            } else {
                res.redirect('/teachers/?error=duplicate');
            }
        })
    }

})

// удаление пользователей из базы данных
router.post('/teachers/delete', async (req, res) => {

    db.run(`DELETE FROM teachers WHERE id = ${req.body.id};`, () => {
        res.redirect('/teachers');
    });
})

// добавление занятия в базу данных
router.post('/classes-teachers/add', async (req, res) => {
    if (req?.session?.data?.role == 'responsible') {
        db.all(`SELECT * FROM classes_teachers WHERE teacherID = ${req.body.teacher} AND subjectID = ${req.body.subject}`, async (err, rows) => {
            if (rows?.length != 0) {
                res.redirect('/classes-teachers/?error=duplicate');
                return;
            }
            db.run('INSERT INTO classes_teachers (teacherID, subjectID) VALUES (?, ?)', [
                req.body.teacher, req.body.subject
            ], () => {
                res.redirect('/classes-teachers');
            })
        })
    }
})
router.post('/classes-teachers/delete', async (req, res) => {
    if (req.session.data.role == 'responsible') {
        db.run(`DELETE FROM classes_teachers WHERE id = ${req.body.id};`, () => {
            res.redirect('/classes-teachers');
        });
    }
});



module.exports = router;
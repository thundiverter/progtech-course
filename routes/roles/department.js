const express = require('express');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

function getUserInitials(firstName, lastName, middleName = '') {
    return `${lastName} ${firstName[0] + '.'} ${ (middleName) ? (middleName[0] + '.') : '' }`;
}

const departmentTabs = [
    { title: 'Дисциплины', path: '/subjects', icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>' },
    { title: 'Группы', path: '/groups', icon: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { title: 'Занятия', path: '/classes', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' }
];

// subjects
router.get('/subjects', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'department')) {
        res.render('404');
    } else {
        db.all('SELECT * from subjects', async (err, rows) => {
            if (err) { return []; }
            res.render('index', {
                name: getUserInitials(
                    req.session.data['first_name'],
                    req.session.data['last_name'],
                    req.session.data['middle_name']
                ),
                role: req.session.data.role,
                tabs: departmentTabs,
                path: req.url,
                title: 'Дисциплины',
                data: rows,
                viewPath: 'pages/department/subjects'
            })
        })
    }
})
// groups
router.get('/groups', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'department')) {
        res.render('404');
    } else {
        db.all('SELECT * from groups', async (err, rows) => {
            if (err) { return []; }
            res.render('index', {
                name: getUserInitials(
                    req.session.data['first_name'],
                    req.session.data['last_name'],
                    req.session.data['middle_name']
                ),
                role: req.session.data.role,
                tabs: departmentTabs,
                path: req.url,
                title: 'Группы',
                data: rows,
                viewPath: 'pages/department/groups'
            })
        })
    }
})
// classes
router.get('/classes', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'department')) {
        res.render('404');
    } else {
        db.all('SELECT * from classes_groups', async (err, rows) => {
            if (err) { return []; }
            db.all('SELECT * from groups ORDER BY title ASC', async (err, rows2) => {
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
                        tabs: departmentTabs,
                        path: req.url,
                        title: 'Занятия',
                        data: [rows, rows2, rows3],
                        viewPath: 'pages/department/classes'
                    })
                })
            })
        })
    }
})

// добавление дисциплины в базу данных
router.post('/subjects/add', async (req, res) => {
    if (req?.session?.data?.role == 'department') {
        db.all(`SELECT * FROM subjects WHERE title = '${req.body.title}'`, async (err, rows) => {
            console.log(rows);
            if (rows?.length != 0) {
                res.redirect('/subjects/?error=duplicate');
                return;
            }
            db.run('INSERT INTO subjects (title) VALUES (?)', [
                req.body.title
            ], () => {
                res.redirect('/subjects');
            })

        })
    }
})
router.post('/subjects/delete', async (req, res) => {

    db.run(`DELETE FROM subjects WHERE id = ${req.body.id};`, () => {
        res.redirect('/subjects');
    });
});

// добавление группы в базу данных
router.post('/groups/add', async (req, res) => {
    if (req?.session?.data?.role == 'department') {
        db.all(`SELECT * FROM groups WHERE title = '${req.body.title}'`, async (err, rows) => {
            if (rows?.length != 0) {
                res.redirect('/groups/?error=duplicate');
                return;
            }
            db.run('INSERT INTO groups (title) VALUES (?)', [
                req.body.title
            ], () => res.redirect('/groups'))
        })
    }
})
router.post('/groups/delete', async (req, res) => {

    db.run(`DELETE FROM groups WHERE id = ${req.body.id};`, () => {
        res.redirect('/groups');
    });
});

// добавление занятия в базу данных
router.post('/classes/add', async (req, res) => {
    if (req.session.data.role == 'department') {
        db.all(`SELECT * FROM classes_groups`, async (err, rows) => {
            if (err) { return []; }
            let flag = true;
            for (let row of rows) {
                if (row.groupID == req.body.group && row.subjectID == req.body.subject && row.type == req.body.classType) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                db.run('INSERT OR IGNORE INTO classes_groups (groupID, subjectID, type) VALUES (?, ?, ?)', [
                    req.body.group, req.body.subject, req.body.classType
                ], () => {
                    res.redirect('/classes');
                })
            } else {
                res.redirect('/classes/?error=duplicate');
            }
        })
        
    }
    
});
router.post('/classes/delete', async (req, res) => {
    if (req.session.data.role == 'department') {
        db.run(`DELETE FROM classes_groups WHERE id = ${req.body.id};`, () => {
            res.redirect('/classes');
        });
    }
});

module.exports = router;
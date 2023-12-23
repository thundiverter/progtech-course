const express = require('express');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

function getUserInitials(firstName, lastName, middleName = '') {
    return `${lastName} ${firstName[0] + '.'} ${ (middleName) ? (middleName[0] + '.') : '' }`;
}

const dispatcherTabs = [
    { title: 'Расписание', path: '/timetable', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' }
];

// timetable
router.get('/timetable', async (req, res) => {
    if (!req.session.data || (req.session.data.role != 'dispatch')) {
        res.render('404');
    } else {
        db.all(`
        SELECT timetable.id, groups.title AS group_title, subjects.title AS subject_title,
        teachers.first_name AS teacher_first,
        teachers.middle_name AS teacher_middle,
        teachers.last_name AS teacher_last, classes_groups.type, timetable.dayOfWeek, timetable.pair
        FROM timetable
        JOIN classes_groups ON timetable.class_group = classes_groups.id
        JOIN groups ON classes_groups.groupID = groups.id
        JOIN subjects ON classes_groups.subjectID = subjects.id
        JOIN classes_teachers ON timetable.class_teacher = classes_teachers.id
        JOIN teachers ON classes_teachers.teacherID = teachers.id
        `, async(err, rows) => {
            if (err) { res.send(err); }
            db.all(`
            SELECT classes_groups.id,
            groups.title AS group_title, classes_groups.groupID AS group_id,
            subjects.title AS subject_title, classes_groups.subjectID AS subject_id,
            classes_groups.type
            FROM classes_groups
            JOIN groups ON classes_groups.groupID = groups.id
            JOIN subjects ON classes_groups.subjectID = subjects.id
            `, async (err, rows2) => {
                if (err) { res.send(err); }
                db.all(`
                SELECT classes_teachers.id AS id,
                classes_teachers.teacherID AS teacher_id,
                teachers.first_name AS teacher_first,
                teachers.middle_name AS teacher_middle,
                teachers.last_name AS teacher_last,
                classes_teachers.subjectID AS subject_id,
                subjects.title AS subject_title
                FROM classes_teachers
                JOIN teachers ON classes_teachers.teacherID = teachers.id
                JOIN subjects ON classes_teachers.subjectID = subjects.id
                `, async (err, rows3) => {
                    if (err) { res.send(err); }
                    res.render('index', {
                        name: getUserInitials(
                            req.session.data['first_name'],
                            req.session.data['last_name'],
                            req.session.data['middle_name']
                        ),
                        role: req.session.data.role,
                        tabs: dispatcherTabs,
                        path: req.url,
                        title: 'Расписание',
                        data: [rows, rows2, rows3],
                        viewPath: 'pages/dispatcher/timetable'
                    })
                })
            })
        })
    }
})

// добавление занятия в базу данных
router.post('/timetable/add', async (req, res) => {
    if (req.session.data && req.session.data.role == 'dispatch') {
        db.run('INSERT OR IGNORE INTO timetable (class_group, class_teacher, dayOfWeek, pair) VALUES (?, ?, ?, ?)', [
            req.body.group, req.body.teacher, req.body.dayOfWeek, req.body.pair
        ], () => {
            res.redirect('/timetable');
        })
    }
    
});

router.post('/timetable/delete', async (req, res) => {
    if (req.session.data.role == 'dispatch') {
        db.run(`DELETE FROM timetable WHERE id = ${req.body.id};`, () => {
            res.redirect('/timetable');
        });
    }
});

module.exports = router;
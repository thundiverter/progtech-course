const express = require('express');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const router = express.Router();

// бд
const db = new sqlite3.Database('./db/database.db');

/* GET home page */
router.get('/', (req, res) => {
    if (!req.session.data) {
        res.render('login', {
            queries: req.query || []
        });
    } else {
        switch (req.session.data.role) {
            case 'department':
                res.redirect('subjects');
                break;
            case 'responsible':
                res.redirect('teachers');
                break;
            case 'dispatch':
                res.redirect('timetable');
                break;
            case 'admin':
                res.redirect('users');
                break;
        }
    }
})





module.exports = router;
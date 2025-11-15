import express from 'express'
const router = express.Router()

router.get('/', (req, res) => {
    res.send('Users endpoint was accessed.');
});

router.get('/new', (req, res) => {
    res.send('New User endpoint was accessed.');
});

export default router
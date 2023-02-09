const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();


router.get('/healthz', (req, res) => {
    res.send("I'm receiving");
});

router.get('*', (req, res) => {
    res.status(404);
    res.send();
});


app.use('/v1', require('./controller/controller'));
app.use('/', router);

module.exports = app;
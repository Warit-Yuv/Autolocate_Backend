import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import tenantRouter from './routes/tenant.js'
import adminRouter from './routes/admin.js'
import staffRouter from './routes/staff.js'
dotenv.config()

const app = express()
const port = process.env.PORT || 3001
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/tenant', tenantRouter)
app.use('/api/staff', staffRouter)
app.use('/api/admin', adminRouter)
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    console.log('Root endpoint was accessed.');
//    res.send('Hi there! This is AutoLocate Backend Service.');
//    res.status(200).json({"message": "Hi there! This is AutoLocate Backend Service."});
//    res.download("index.js");  // for file download
    res.render('index', {text: "This is AutoLocate Backend Service."});  // for view rendering
});

app.get('/rr', (req, res) => {
    res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="0; URL='https://www.youtube.com/watch?v=dQw4w9WgXcQ'" />
      </head>
      <body></body>
    </html>
  `);
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
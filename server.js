import express from 'express'
import dotenv from 'dotenv'
import userRouter from './routes/user.js'
import adminRouter from './routes/admin.js'
import staffRouter from './routes/staff.js'
dotenv.config()

const app = express()
const port = process.env.PORT || 3000
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

app.use('/users', userRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
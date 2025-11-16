import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import tenantRouter from './routes/tenant.js'
import adminRouter from './routes/admin.js'
import staffRouter from './routes/staff.js'
import authRouter from './routes/auth.js'
dotenv.config()

const app = express()
const port = process.env.PORT || 3001
// Allow frontend at localhost:3000 to send cookies (credentials)
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser())
app.use(express.json());
app.use('/api/tenant', tenantRouter)
app.use('/api/staff', staffRouter)
app.use('/api/admin', adminRouter)
app.use('/api/auth', authRouter)
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

// Test bcrypt hashing endpoint where when visits /hashme?password=yourpassword it returns the hashed password
app.get('/hashme', async (req, res) => {
    const bcrypt = await import('bcrypt');
    const password = req.query.password || 'default_password';
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    res.send(`Hashed password: ${hashedPassword}`);
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
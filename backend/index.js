require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupUserManagementRoutes = require('./routes/groupUserManagementRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

app.use(cors({
    origin: 'http://192.168.214.53:8081',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/aroundu')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} to ${req.url}`);
  req.on('end', () => console.log(`Request finished - ${req.method} to ${req.url}`));
  req.on('close', () => console.log(`Request closed - ${req.method} to ${req.url}`));
  next();
});

app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/group', groupRoutes);
app.use('/group', groupUserManagementRoutes);
app.use('/file', fileRoutes);
app.use('/static', express.static('uploads'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
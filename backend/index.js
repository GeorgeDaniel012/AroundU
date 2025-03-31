require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/aroundu')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('Hello World');
});
//app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
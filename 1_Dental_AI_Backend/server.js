require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const helmet = require('helmet'); 
const morgan = require('morgan'); 

const diagnosisRoutes = require('./routes/diagnosisRoutes');
const authRoutes = require('./routes/authRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(morgan('dev'));


app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected successfully from .env'))
    .catch((err) =>{
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    } 
);

app.use('/api/diagnoses', diagnosisRoutes); 
app.use('/api/auth', authRoutes); 
app.use(notFound); 
app.use(errorHandler); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
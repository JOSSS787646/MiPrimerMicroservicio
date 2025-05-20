const express = require('express');
const dotenv = require('dotenv');
const personaRoutes = require('./routes/personaRoutes');

dotenv.config();



const app = express();
app.use(express.json());

app.use('/api/personas', personaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
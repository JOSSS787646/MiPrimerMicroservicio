const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');

// Ruta para creación de personas
router.post('/registrar-ine', personaController.crearPersona);

// Ruta para búsqueda por CURP (usando GET con parámetro en URL)
router.get('/buscar-curp/:curp', personaController.buscarPorCurp);

//Ruta para acceder a la ontecion de todas las perrsonas
router.get('/obtener-usuarios', personaController.obtenerTodasLasPersonas);

//Ruta para poder eliminar a un usuario a atrves del CURP
router.delete('/eliminar-curp/:curp', personaController.eliminarPorCurp);

//Ruta para poder eliminar a una persona a traves del ID
router.delete('/eliminar-id/:id', personaController.eliminarPorId);

module.exports = router;
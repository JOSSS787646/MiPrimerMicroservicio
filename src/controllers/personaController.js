const db = require('../config/db');
const PersonaService = require('../services/personaService');

class PersonaController {
  constructor() {
    this.service = new PersonaService(db);
    // Bind explícito de todos los métodos
    this.crearPersona = this.crearPersona.bind(this);
    this.buscarPorCurp = this.buscarPorCurp.bind(this);
    this.obtenerTodasLasPersonas = this.obtenerTodasLasPersonas.bind(this);
    this.eliminarPorCurp = this.eliminarPorCurp.bind(this);
      this.eliminarPorId = this.eliminarPorId.bind(this);
  }


  //METODO PARA REPONDER A LA INSERCCION DE UNA PERSONA
  async crearPersona(req, res) {
  try {
    await this.service.crearPersona(req.body);
    res.status(201).json({ status: 'created' });
  } catch (error) {
    if (error.message.includes('no válidos')) {
      return res.status(400).json({ status: 'invalid_data' });
    }
    res.status(500).json({ status: 'server_error' });
  }
}

//METOOD PARA RESPONDER AL OBTENER TODAS LAS PERSONAS DE LA BD 
async obtenerTodasLasPersonas(req, res) {
  try {
    const personas = await this.service.obtenerTodasLasPersonas();
    
    res.json({
      success: true,
      count: personas.length,
      data: personas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en obtenerTodasLasPersonas:', error);
    res.status(500).json({
      success: false,
      error: 'ERROR_BASE_DATOS',
      message: 'Error al obtener los registros',
      ...(process.env.NODE_ENV === 'development' && { detalles: error.message })
    });
  }
}


//METODO PARA RESPONDER A LA BUSQUEDA POR CURP
async buscarPorCurp(req, res) {
  try {
    const { curp } = req.params;
    const resultado = await this.service.buscarPorCurp(curp);
    
    if (!resultado) {
      return res.status(404).json({ 
        success: false,
        error: 'no_encontrado',
        message: 'No existe registro con esa CURP' 
      });
    }

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    const status = error.message.includes('inválid') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: 'error_consulta',
      message: error.message
    });
  }
}


//METODO QUE RESPONDE A LA ELINACION DEUN USUARIO A TARVES DEL CURP
async eliminarPorCurp(req, res) {
  try {
    const { curp } = req.params;

    // Validación básica
    if (!curp || curp.length !== 18) {
      return res.status(400).json({
        success: false,
        error: 'CURP_INVALIDA',
        message: 'La CURP debe tener exactamente 18 caracteres'
      });
    }

    const resultado = await this.service.eliminarPorCurp(curp);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    const statusCode = error.message.includes('No existe') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NO_ENCONTRADO' : 'ERROR_ELIMINACION',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}


//METODO QUE RESPONDE A LA ELIMINACION DE UAN PERSONA POR ID
async eliminarPorId(req, res) {
  try {
    const { id } = req.params;

    // Validación básica de ID
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID_INVALIDO',
        message: 'El ID debe ser un número positivo'
      });
    }

    const resultado = await this.service.eliminarPorId(parseInt(id));

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    const statusCode = error.message.includes('No existe') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'NO_ENCONTRADO' : 'ERROR_ELIMINACION',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { detalles: error.stack })
    });
  }
}


}




module.exports = new PersonaController();
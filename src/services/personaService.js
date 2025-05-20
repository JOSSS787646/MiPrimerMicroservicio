const Persona = require('../models/personaModel');
const Direccion = require('../models/direccionModel');
const CredencialIne = require('../models/credencialIneModel');

class PersonaService {
  constructor(db) {
    if (!db) throw new Error('Se requiere conexión a BD');
    this.db = db;
    
    // Validación de modelos
    if (!Persona || !Direccion || !CredencialIne) {
      throw new Error('Modelos no están correctamente definidos');
    }
  }

  async crearPersona(datosPersona) {
    // Validación básica
    if (!datosPersona || typeof datosPersona !== 'object') {
      throw new Error('Datos de persona no válidos');
    }

    // Crear instancias de los modelos con validación
    let persona, direccion, credencial;
    try {
      persona = new Persona(datosPersona);
      direccion = new Direccion(datosPersona);
      credencial = new CredencialIne(datosPersona);
    } catch (error) {
      throw new Error(`Error en modelos: ${error.message}`);
    }

    const connection = await this.db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insertar persona
      const [resultPersona] = await connection.execute(
        `INSERT INTO personas (nombre, apellido_paterno, apellido_materno, sexo, fecha_nacimiento) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          persona.nombre,
          persona.apellido_paterno,
          persona.apellido_materno,
          persona.sexo,
          persona.fecha_nacimiento || null
        ]
      );

      // Validar inserción exitosa
      if (!resultPersona?.insertId) {
        throw new Error('Error al insertar persona: no se obtuvo ID');
      }

      // 2. Insertar dirección
      await connection.execute(
        `INSERT INTO direcciones 
         (persona_id, direccion_completa, estado, municipio, seccion, codigo_postal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          resultPersona.insertId,
          direccion.direccion_completa,
          direccion.estado,
          direccion.municipio,
          direccion.seccion,
          direccion.codigo_postal || null
        ]
      );

      // 3. Insertar credencial
      await connection.execute(
        `INSERT INTO credenciales_ine 
         (persona_id, curp, clave_elector, anio_emision, vigencia, numero_credencial)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          resultPersona.insertId,
          credencial.curp,
          credencial.clave_elector,
          credencial.anio_emision,
          credencial.vigencia,
          credencial.numero_credencial || null
        ]
      );

      await connection.commit();

      return {
        id: resultPersona.insertId,
        persona: persona,
        direccion: direccion,
        credencial: credencial,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error en transacción:', {
        error: error.message,
        stack: error.stack,
        datos: datosPersona
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }


//MEOTOD QUE PERMITE OBTENER LOS DATOS DE LA BD UTILIZANDO INNER JOINS
  async obtenerTodasLasPersonas() {
  const connection = await this.db.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT 
         p.id,
         p.nombre,
         p.apellido_paterno,
         p.apellido_materno,
         p.sexo,
         p.fecha_nacimiento,
         d.direccion_completa,
         d.estado,
         d.municipio,
         d.seccion,
         d.codigo_postal,
         c.curp,
         c.clave_elector,
         c.anio_emision,
         c.vigencia,
         c.numero_credencial
       FROM personas p
       JOIN direcciones d ON p.id = d.persona_id
       JOIN credenciales_ine c ON p.id = c.persona_id
       ORDER BY p.id DESC`
    );

    return rows.map(row => ({
      id: row.id,
      informacionPersonal: {
        nombreCompleto: `${row.nombre} ${row.apellido_paterno} ${row.apellido_materno}`,
        sexo: row.sexo === 'H' ? 'Hombre' : 'Mujer',
        fechaNacimiento: row.fecha_nacimiento
      },
      direccion: {
        completa: row.direccion_completa,
        estado: row.estado,
        municipio: row.municipio,
        seccion: row.seccion,
        codigoPostal: row.codigo_postal
      },
      credencial: {
        curp: row.curp,
        claveElector: row.clave_elector,
        vigencia: row.vigencia,
        numeroCredencial: row.numero_credencial,
        anioEmision: row.anio_emision,
        vigente: row.vigencia > new Date().getFullYear()
      }
    }));
  } catch (error) {
    console.error('Error al obtener todas las personas:', error);
    throw new Error('Error al recuperar los datos de personas');
  } finally {
    connection.release();
  }
}



// METODO QUE PERMITE BUSCCAR A UAN PERSONA POR SU CURP, UTILIZANDO  INENR JOINS
  async buscarPorCurp(curp) {
    // Validación robusta de CURP
    const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;
    if (!curp || !CURP_REGEX.test(curp)) {
      throw new Error('Formato de CURP inválido. Debe tener 18 caracteres alfanuméricos');
    }

    const connection = await this.db.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
           p.nombre,
           p.apellido_paterno,
           p.apellido_materno,
           p.sexo,
           p.fecha_nacimiento,
           d.direccion_completa,
           d.estado,
           d.municipio,
           d.seccion,
           d.codigo_postal,
           c.curp,
           c.clave_elector,
           c.anio_emision,
           c.vigencia,
           c.numero_credencial
         FROM personas p
         JOIN direcciones d ON p.id = d.persona_id
         JOIN credenciales_ine c ON p.id = c.persona_id
         WHERE c.curp = ? LIMIT 1`,
        [curp]
      );
      
      if (rows.length === 0) {
        return null;
      }

      return {
        ...rows[0],
        // Campos calculados
        nombreCompleto: `${rows[0].nombre} ${rows[0].apellido_paterno} ${rows[0].apellido_materno}`,
        sexoDescripcion: rows[0].sexo === 'H' ? 'Hombre' : 'Mujer',
        credencialVigente: rows[0].vigencia > new Date().getFullYear()
      };
      
    } catch (error) {
      console.error('Error en búsqueda por CURP:', {
        message: error.message,
        curp: curp,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }



  //METODO QUE PERMITE ELIMINAR POR CURP A TRAVES DE INNER JOIN
  async eliminarPorCurp(curp) {
  const connection = await this.db.getConnection();
  try {
    // Validación de formato CURP
    if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(curp)) {
      throw new Error('Formato de CURP inválido');
    }

    await connection.beginTransaction();

    // 1. Primero obtenemos el ID de la persona
    const [personaRows] = await connection.execute(
      `SELECT p.id 
       FROM personas p
       JOIN credenciales_ine c ON p.id = c.persona_id
       WHERE c.curp = ?`,
      [curp]
    );

    if (personaRows.length === 0) {
      throw new Error('No existe registro con esa CURP');
    }

    const personaId = personaRows[0].id;

    // 2. Eliminamos en cascada (por las FOREIGN KEY con ON DELETE CASCADE)
    const [result] = await connection.execute(
      `DELETE FROM personas WHERE id = ?`,
      [personaId]
    );

    await connection.commit();

    return {
      filasEliminadas: result.affectedRows,
      mensaje: 'Registro eliminado exitosamente',
      curpEliminada: curp
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar por CURP:', error);
    throw error;
  } finally {
    connection.release();
  }
}

//METODO PARA ELIMINAR POR ID A UNA PERSONA
async eliminarPorId(id) {
  const connection = await this.db.getConnection();
  try {
    // Validación de ID
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('ID de persona inválido');
    }

    await connection.beginTransaction();

    // 1. Verificar existencia de la persona
    const [personaRows] = await connection.execute(
      `SELECT id FROM personas WHERE id = ?`,
      [id]
    );

    if (personaRows.length === 0) {
      throw new Error('No existe persona con el ID especificado');
    }

    // 2. Eliminamos en cascada (por las FOREIGN KEY con ON DELETE CASCADE)
    const [result] = await connection.execute(
      `DELETE FROM personas WHERE id = ?`,
      [id]
    );

    await connection.commit();

    return {
      filasEliminadas: result.affectedRows,
      mensaje: 'Registro y sus relaciones eliminados exitosamente',
      idEliminado: id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar por ID:', {
      error: error.message,
      id: id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  } finally {
    connection.release();
  }
}
}

module.exports = PersonaService;
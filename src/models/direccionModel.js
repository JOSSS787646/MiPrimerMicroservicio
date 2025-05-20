class Direccion {
  constructor({ direccion_completa, estado, municipio, seccion, codigo_postal }) {
    this.direccion_completa = direccion_completa;
    this.estado = estado;
    this.municipio = municipio;
    this.seccion = seccion;
    this.codigo_postal = codigo_postal;
  }
}

module.exports = Direccion;
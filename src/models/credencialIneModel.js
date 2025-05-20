class CredencialIne {
  constructor({ curp, clave_elector, anio_emision, vigencia, numero_credencial }) {
    this.curp = curp;
    this.clave_elector = clave_elector;
    this.anio_emision = anio_emision;
    this.vigencia = vigencia;
    this.numero_credencial = numero_credencial || null;
  }
}

// Asegúrate de exportar la clase correctamente
module.exports = CredencialIne;
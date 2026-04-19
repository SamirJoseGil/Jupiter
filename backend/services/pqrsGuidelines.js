const GUIDELINES = `
Manual PQRSD del Distrito de Medellin (resumen operativo):
- Cumplir Ley 1755 de 2015 (derecho de peticion) y lineamientos anticorrupcion.
- Respuestas al ciudadano deben ser claras, completas, congruentes y oportunas.
- Debe existir trazabilidad y radicado oficial de salida.
- No responder con notas internas o mensajes informales.
- Priorizar casos de riesgo, poblacion vulnerable y derechos fundamentales.
- En caso de no competencia, remitir a entidad competente maximo en 5 dias.
- Canales no oficiales deben formalizarse en canal oficial para iniciar terminos legales.
- Solicitar aclaracion o informacion adicional cuando aplique, sin perder trazabilidad.
- Proteger datos personales y evitar divulgar informacion reservada.
- Mantener lenguaje simple, institucional y orientado a la solucion.
`;

const DEFAULT_TEMPLATE = `Cordial saludo,\n\nHemos recibido su PQRSDF con radicado #{{RADICADO}}.\n\n{{RESUMEN_CASO}}\n\nDe manera preliminar, la solicitud fue orientada a {{DEPENDENCIA}} para su gestion conforme al Manual de PQRSD del Distrito de Medellin y la Ley 1755 de 2015.\n\nSi se requiere informacion adicional, nos comunicaremos por los canales oficiales.\n\nAtentamente,\nEquipo de Atencion a la Ciudadania\nAlcaldia de Medellin`;

module.exports = {
  GUIDELINES,
  DEFAULT_TEMPLATE,
};

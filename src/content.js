// Textos centralizados. Confirmados por Marketing 3D salvo los marcados PROVISIONAL.
export const content = {
  marca: { nombre: '3Dezign', provisional: true /* PROVISIONAL: nombre pendiente de confirmación del usuario */ },
  hero: {
    titulo: 'Diseñamos y fabricamos, capa por capa.',
    subtitulo: 'Impresión 3D, carpintería y artesanía desde Calkiní, Campeche.',
    boton: 'Cotiza tu idea',
    final: 'Así nace cada pieza: de una idea a algo que puedes tocar.',
  },
  impresion: {
    titulo: 'Impresión 3D',
    texto: 'Refacciones que ya no se consiguen, prototipos para tus proyectos, regalos personalizados con nombre o foto, y piezas para tu negocio. Trabajamos en PLA, PETG y materiales técnicos, con medidas precisas.',
    tarjetas: ['Refacciones', 'Prototipos y proyectos escolares', 'Regalos personalizados', 'Para negocios'],
    dato: 'Creality K1C · PLA · PETG · materiales técnicos',
  },
  personalizado: { // Textos finales de Marketing 3D / dirección
    titulo: 'Si lo imaginas, lo fabricamos',
    texto: 'Cada pieza se construye capa por capa a partir de un diseño digital. No hay moldes ni mínimos de producción, así que una sola pieza puede ser única.',
    bloques: [
      { titulo: 'Personalizado de verdad', texto: 'Medidas exactas, tu nombre, tu logo o la forma que necesites. Diseñamos desde cero o adaptamos tu idea, ya sea un repuesto, un regalo o un prototipo.' },
      { titulo: 'Más que plástico', texto: 'La impresión 3D se combina con otros materiales:', lista: [
        ['Madera', 'bases, cajas y letreros con piezas impresas encajadas.'],
        ['Metal', 'tornillería, imanes e insertos roscados para piezas que se arman y desarman.'],
        ['Textil y piel', 'hebillas, broches y piezas para artesanía local.'],
        ['Resina y pintura', 'acabados lisos, brillantes o pintados a mano.'],
      ] },
    ],
    cierre: 'Plástico, madera y metal en una misma pieza.',
    boton: 'Cotiza tu idea',
  },
  despiece: {
    // TEXTO PROVISIONAL - pendiente Marketing 3D (salvo la descripción del motor, que es final)
    eyebrow: 'Despiece del extrusor · K1C',
    titulo: 'Dentro del extrusor',
    texto: 'Así funciona la pieza que da forma a cada capa: el filamento entra frío, se funde en el bloque caliente y sale por la boquilla.',
    piezas: [
      ['Tubo PTFE', 'Guía el filamento desde el carrete hasta el extrusor.'],
      ['Motor', 'Mueve los engranes que empujan el filamento.'],
      ['Engranes de tracción', 'Sujetan el filamento y lo empujan hacia abajo.'],
      ['Disipador', 'Mantiene fría la parte de arriba para que el filamento no se ablande antes de tiempo.'],
      ['Ventilador', 'Sopla aire a través del disipador.'],
      ['Ducto', 'Dirige el aire hacia la pieza recién impresa.'],
      ['Bloque calentador', 'Funde el filamento a la temperatura del material.'],
      ['Cartucho calefactor', 'La resistencia que calienta el bloque.'],
      ['Termistor', 'Mide la temperatura para mantenerla estable.'],
      ['Boquilla', 'Deposita el plástico fundido, línea por línea.'],
    ],
  },
  carpinteria: { // PROVISIONAL: contenido pendiente del usuario
    titulo: 'Carpintería',
    texto: 'Piezas en madera hechas a mano, que combinamos con impresión 3D cuando el diseño lo pide.',
    pendiente: 'Productos próximamente',
  },
  artesanias: { // PROVISIONAL: contenido pendiente del usuario
    titulo: 'Artesanías',
    texto: 'Diseños inspirados en nuestra tierra: la geometría maya, el Arco de Calkiní y la tradición de la región, hechos con técnicas nuevas.',
    pendiente: 'Productos próximamente',
  },
  nosotros: {
    titulo: 'Sobre nosotros',
    texto: '3Dezign nace en Calkiní, Campeche, para acercar la fabricación digital a la región. Unimos la mecatrónica, el diseño 3D y el oficio artesanal para resolver problemas reales y crear piezas con identidad.',
  },
  contacto: {
    titulo: 'Contacto',
    texto: '¿Tienes una idea, una pieza rota o un proyecto? Cuéntanos y te cotizamos.',
    ubicacion: 'Calkiní, Campeche',
    canales: ['WhatsApp', 'Facebook', 'Correo'], // sin enlaces reales: «Próximamente»
    avisoForm: 'El formulario aún no está activo. Muy pronto podrás enviarnos tu idea por aquí.',
  },
  pie: '© 3Dezign · Calkiní, Campeche.',
};

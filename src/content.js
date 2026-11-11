// Textos centralizados. Confirmados por Marketing 3D salvo los marcados PROVISIONAL.
export const content = {
  marca: { nombre: 'Camino Digital', provisional: false },
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
  personalizado: { // Textos DEFINITIVOS de Marketing 3D
    titulo: 'Si lo imaginas, lo fabricamos',
    texto: 'Cada pieza se construye capa por capa desde un diseño digital. No hay moldes ni mínimos, así que una sola pieza puede ser única.',
    bloques: [
      { titulo: 'Hecho a tu medida', lista: [
        ['Medida exacta', 'piezas que encajan justo donde las necesitas.'],
        ['Tu nombre o tu foto', 'llaveros, letreros y litofanías que muestran tu foto a contraluz.'],
        ['Piezas únicas', 'regalos, trofeos y prototipos de una sola unidad.'],
        ['Refacciones', 'perillas, clips, engranes y tapas que ya no se consiguen.'],
      ] },
      { titulo: 'Más que plástico', lista: [
        ['Madera', 'bases, cajas y letreros con piezas impresas encajadas.'],
        ['Resina', 'acabado liso y brillante, o piezas con incrustaciones.'],
        ['Tela', 'hebillas, broches y piezas para bordado e hipiles.'],
        ['Metal', 'insertos roscados, imanes y tornillería para armar y desarmar.'],
        ['Electrónica', 'carcasas a medida para lámparas LED, sensores y proyectos con Arduino.'],
      ] },
    ],
    cierre: 'Plástico, madera, metal y luz en una misma pieza.',
    boton: 'Cotiza tu idea',
  },
  nombre3d: { // textos finales de Marketing 3D
    titulo: 'Tu nombre en 3D',
    texto: 'Escribe tu nombre y descarga tu llavero listo para imprimir: una sola pieza, con ojal para la argolla.',
    campo: 'Tu nombre',
    ayuda: 'Solo letras, hasta 12. Acentos y ñ, sí.',
    modelo: 'Elige el modelo',
    modelos: [ // orden y textos de Marketing 3D; el primero queda elegido
      { id: 'letras', nombre: 'Solo letras', nota: 'Tu nombre, sin fondo' },
      { id: 'fondo', nombre: 'Con fondo', nota: 'Letras sobre una base redondeada' },
      { id: 'hueso', nombre: 'Huesito', nota: 'Ideal para el collar de tu perro' },
      { id: 'cuadros', nombre: 'Cuadritos', nota: 'Cada letra en su cuadro, en relieve' },
    ],
    noCabe: 'Tu nombre es muy largo para este modelo. Prueba con otro modelo o con un nombre más corto.',
    noCabeEstilo: 'Tu nombre es muy largo para este estilo de letra. Prueba con otro estilo o con un nombre más corto.',
    estilo: 'Elige el estilo de letra',
    descargar: 'Descargar mi llavero (STL)',
    impreso: 'Lo quiero impreso',
    vacio: 'Escribe tu nombre para ver cómo queda',
    legal: 'Archivo gratuito para uso personal. No se permite revenderlo ni usarlo con fines comerciales.',
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
    texto: 'Camino Digital nace en Calkiní, Campeche, para acercar la fabricación digital a la región. Unimos la mecatrónica, el diseño 3D y el oficio artesanal para resolver problemas reales y crear piezas con identidad.',
  },
  contacto: {
    titulo: 'Contacto',
    texto: '¿Tienes una idea, una pieza rota o un proyecto? Cuéntanos y te cotizamos.',
    ubicacion: 'Calkiní, Campeche',
    canales: ['WhatsApp', 'Facebook', 'Correo'], // sin enlaces reales: «Próximamente»
    avisoForm: 'El formulario aún no está activo. Muy pronto podrás enviarnos tu idea por aquí.',
  },
  pie: '© Camino Digital · Calkiní, Campeche.',
};

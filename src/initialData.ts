/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, DesignPiece, PreloadedTask, Budget, Project } from './types';

// Preloaded Design Pieces (with preset values in ARS representing Cliente B rates)
export const PRELOADED_PIECES: DesignPiece[] = [
  {
    id: 'pc_hour',
    name: 'Hora de Trabajo (Diseño, asesoramiento, consultoría o supervisión de trabajos)',
    category: 'Asesoramiento',
    price: 26100,
    description: 'Diseño, asesoramiento, consultoría o supervisión de trabajos.'
  },
  {
    id: 'pc_id_1',
    name: 'Nueva Identidad Corporativa',
    category: 'Identidad',
    price: 1160200,
    description: 'Nuevo logotipo, Isotipo o Isologotipo + Manual de Uso y hasta 5 aplicaciones.'
  },
  {
    id: 'pc_id_2',
    name: 'Nuevo logotipo/isotipo/imagotipo/isologo',
    category: 'Identidad',
    price: 463400,
    description: 'No incluye Manual de Uso ni aplicaciones.'
  },
  {
    id: 'pc_id_3',
    name: 'Rediseño Identidad Corporativa',
    category: 'Identidad',
    price: 1160200,
    description: 'Creación de un nuevo logo en reemplazo de uno ya existente + Manual de Uso y hasta 5 aplicaciones.'
  },
  {
    id: 'pc_id_4',
    name: 'Rediseño logotipo/isotipo/imagotipo/isologo',
    category: 'Identidad',
    price: 463400,
    description: 'No incluye Manual de Uso ni aplicaciones.'
  },
  {
    id: 'pc_id_5',
    name: 'Restyling Identidad Corporativa',
    category: 'Identidad',
    price: 969200,
    description: 'Optimización de un logo ya existente para mejorarlo o modernizarlo + Manual de Uso y hasta 5 aplicaciones.'
  },
  {
    id: 'pc_id_6',
    name: 'Restyling logotipo/isotipo/imagotipo/isologo',
    category: 'Identidad',
    price: 353400,
    description: 'No incluye Manual de Uso ni aplicaciones.'
  },
  {
    id: 'pc_id_7',
    name: 'Manual de normas/uso',
    category: 'Identidad',
    price: 309300,
    description: 'Para una marca existente.'
  },
  {
    id: 'pc_id_8',
    name: 'Identidad efímera',
    category: 'Identidad',
    price: 382700,
    description: 'Identidad original adaptada. Ej: aniversario (uso anual), evento/concurso (uso estacional), etc.'
  },
  {
    id: 'pc_id_9',
    name: 'Identidad de un producto',
    category: 'Identidad',
    price: 623400,
    description: 'Consumo masivo.'
  },
  {
    id: 'pc_com_1',
    name: 'Naming corporativo/institucional',
    category: 'Comunicación',
    price: 240600,
    description: 'Proceso de definición de un nombre de marca.'
  },
  {
    id: 'pc_com_2',
    name: 'Naming producto/evento',
    category: 'Comunicación',
    price: 125600,
    description: 'Proceso de definición de un nombre de marca.'
  },
  {
    id: 'pc_com_3',
    name: 'Slogan / Lema',
    category: 'Comunicación',
    price: 125600,
    description: 'Definición o "manera de ser" de una marca.'
  },
  {
    id: 'pc_com_4',
    name: 'Claim',
    category: 'Comunicación',
    price: 125600,
    description: 'Descripción o beneficio que se le atribuye a un servicio o producto.'
  },
  {
    id: 'pc_tex_1',
    name: 'Prenda única',
    category: 'Textil',
    price: 116800,
    description: 'Remera, chomba, camisa o blusa con estampa/bordado.'
  },
  {
    id: 'pc_tex_2',
    name: 'Sistema de uniforme/vestuario completo',
    category: 'Textil',
    price: 630200,
    description: 'Hasta 4 clases (gerencia, adm, operario, etc) con sus respectivas variables para hombre y mujer.'
  },
  {
    id: 'pc_pap_1',
    name: 'Papelería básica',
    category: 'Papelería',
    price: 373600,
    description: 'Utilizando marca existente. Aplicación hasta en 5 piezas (tarjeta, sobre, firma mail, etc).'
  },
  {
    id: 'pc_pap_2',
    name: 'Papelería comercial',
    category: 'Papelería',
    price: 185300,
    description: 'Factura, recibo, remito, anotadores, formularios, etc. Documento completo, NO solo membrete.'
  },
  {
    id: 'pc_pap_3',
    name: 'Tarjetas personales',
    category: 'Papelería',
    price: 79800,
    description: 'Utilizando marca existente o identidad previamente diseñada.'
  },
  {
    id: 'pc_pap_4',
    name: 'Hojas membretadas',
    category: 'Papelería',
    price: 79800,
    description: 'Utilizando marca existente o identidad previamente diseñada.'
  },
  {
    id: 'pc_pap_5',
    name: 'Sobres',
    category: 'Papelería',
    price: 79800,
    description: 'Tipo inglés, bolsa, etc. Utilizando marca existente.'
  },
  {
    id: 'pc_pap_6',
    name: 'Firma o encabezado de e-mail',
    category: 'Papelería',
    price: 79800,
    description: 'Imagen estática. Utilizando marca existente o identidad previamente diseñada.'
  },
  {
    id: 'pc_pap_7',
    name: 'Carpeta empresarial/institucional',
    category: 'Papelería',
    price: 175500,
    description: 'Tipo A3 plegada, con o sin solapas. Utilizando marca existente. No incluye hojas interiores.'
  },
  {
    id: 'pc_pap_8',
    name: 'Certificado',
    category: 'Papelería',
    price: 164900,
    description: 'Asistencia a un evento, reconocimiento, adjudicación de un premio, etc.'
  },
  {
    id: 'pc_pap_9',
    name: 'Postal',
    category: 'Papelería',
    price: 137400,
    description: 'Frente (imagen) y dorso (datos). No incluye costo de fotografía (fotógrafo o banco de imagen).'
  },
  {
    id: 'pc_pub_1',
    name: 'Volante/Flyer sólo frente',
    category: 'Publicidad',
    price: 122000,
    description: 'No incluye costo de fotografías (fotógrafo o banco de imagen).'
  },
  {
    id: 'pc_pub_2',
    name: 'Volante/Flyer frente y dorso',
    category: 'Publicidad',
    price: 188600,
    description: 'No incluye costo de fotografías (fotógrafo o banco de imagen).'
  },
  {
    id: 'pc_pub_3',
    name: 'Folleto díptico',
    category: 'Publicidad',
    price: 262200,
    description: 'Frente y dorso, 1 pliegue. No incluye costo de fotografías.'
  },
  {
    id: 'pc_pub_4',
    name: 'Folleto tríptico',
    category: 'Publicidad',
    price: 353400,
    description: 'Frente y dorso, 2 pliegues. No incluye costo de fotografías.'
  },
  {
    id: 'pc_pub_5',
    name: 'Brochure',
    category: 'Publicidad',
    price: 692300,
    description: 'Folleto de alta complejidad. Hasta 10 páginas/pliegos. No incluye costo de fotografías.'
  },
  {
    id: 'pc_pub_6',
    name: 'Aviso institucional para diario o revista (1/2 pág o menos)',
    category: 'Publicidad',
    price: 106400,
    description: '1/2 página o menos. Sin redacción.'
  },
  {
    id: 'pc_pub_7',
    name: 'Aviso institucional para diario o revista (1 pág o doble pág)',
    category: 'Publicidad',
    price: 161900,
    description: '1 página o doble página. Sin redacción.'
  },
  {
    id: 'pc_pub_8',
    name: 'Aviso publicitario para diario o revista (1/2 pág o menos)',
    category: 'Publicidad',
    price: 188600,
    description: '1/2 página o menos. Sin redacción.'
  },
  {
    id: 'pc_pub_9',
    name: 'Aviso publicitario para diario o revista (1 pág o doble pág)',
    category: 'Publicidad',
    price: 230700,
    description: '1 página o doble página. Sin redacción.'
  },
  {
    id: 'pc_cm_1',
    name: 'Social Media Plan',
    category: 'Community Manager',
    price: 288300,
    description: 'Planteo de estrategia de marketing y comunicación en redes sociales.'
  },
  {
    id: 'pc_cm_2',
    name: 'Creación de perfil, fanpage, grupo, evento, cuenta, canal',
    category: 'Community Manager',
    price: 145900,
    description: 'Incluye avatar, portada, carga de datos y configuración general.'
  },
  {
    id: 'pc_cm_3',
    name: 'Creación de álbum (productos, evento, etc)',
    category: 'Community Manager',
    price: 46800,
    description: 'Subida de al menos 10 imágenes (con logo/marca de agua), videos o textos, etc.'
  },
  {
    id: 'pc_cm_4',
    name: 'Compartir/Repost contenido de tercero',
    category: 'Community Manager',
    price: 16300,
    description: 'Costo x posteo/publicación.'
  },
  {
    id: 'pc_cm_5',
    name: 'Administración/Gestión básica de RRSS',
    category: 'Community Manager',
    price: 192300,
    description: 'Entre 2 y 5 posteos mensuales. Incluye el diseño/armado de las piezas gráficas.'
  },
  {
    id: 'pc_cm_6',
    name: 'Administración/Gestión estándar de RRSS',
    category: 'Community Manager',
    price: 268600,
    description: 'Entre 5 y 10 posteos mensuales. Incluye el diseño/armado de las piezas gráficas.'
  },
  {
    id: 'pc_cm_7',
    name: 'Administración/Gestión intensiva de RRSS',
    category: 'Community Manager',
    price: 346400,
    description: 'Entre 10 y 20 posteos mensuales. Incluye el diseño/armado de las piezas gráficas.'
  },
  {
    id: 'pc_cm_8',
    name: 'Flyers para Instagram',
    category: 'Community Manager',
    price: 24600,
    description: 'Precio de pieza por unidad. Si es dentro de un plan de redes, se estima un descuento del 40% por pieza.'
  },
  {
    id: 'pc_promo_1',
    name: 'Merchandising',
    category: 'Promoción',
    price: 428500,
    description: 'Hasta 10 piezas (remera, llavero, pin, gorra, calco, lapicera, taza, mousepad, etc).'
  },
  {
    id: 'pc_promo_2',
    name: 'Remeras',
    category: 'Promoción',
    price: 84700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_3',
    name: 'Calcos',
    category: 'Promoción',
    price: 68700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_4',
    name: 'Lapicera, pin, llavero',
    category: 'Promoción',
    price: 68700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_5',
    name: 'Pad, funda celulares, taza',
    category: 'Promoción',
    price: 68700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_6',
    name: 'Bandera',
    category: 'Promoción',
    price: 68700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_7',
    name: 'Bolsas / Envoltorios',
    category: 'Promoción',
    price: 84700,
    description: 'Aplicación de logo simple o identidad previamente diseñada.'
  },
  {
    id: 'pc_promo_8',
    name: 'Almanaque de pared tipo "poster"',
    category: 'Promoción',
    price: 241300,
    description: 'Pliego simple. Sólo frente.'
  },
  {
    id: 'pc_promo_9',
    name: 'Almanaque de pared tipo "revista" o "con anillado"',
    category: 'Promoción',
    price: 561500,
    description: 'Hasta 6 pliegos.'
  },
  {
    id: 'pc_edit_1',
    name: 'Arte de tapa',
    category: 'Editorial',
    price: 357700,
    description: 'Tapa, contratapa y lomo (revista, libro, etc.)'
  },
  {
    id: 'pc_edit_2',
    name: 'Armado de página simple',
    category: 'Editorial',
    price: 21500,
    description: 'Costo de diseño por página original. Libro, Memoria y Balance, etc.'
  },
  {
    id: 'pc_edit_3',
    name: 'Armado de página compuesta',
    category: 'Editorial',
    price: 37300,
    description: 'Costo de diseño por página original. Revista, diarios, manuales de estudio, etc.'
  },
  {
    id: 'pc_edit_4',
    name: 'Libro (cuerpo y puesta en página)',
    category: 'Editorial',
    price: 1589200,
    description: 'Hasta 100 páginas.'
  },
  {
    id: 'pc_edit_5',
    name: 'Revista',
    category: 'Editorial',
    price: 715800,
    description: 'Hasta 30 páginas. No incluye armado de publicidades.'
  },
  {
    id: 'pc_edit_6',
    name: 'Catálogo de productos',
    category: 'Editorial',
    price: 1070500,
    description: 'Hasta 20 páginas.'
  },
  {
    id: 'pc_edit_7',
    name: 'Menú/carta para restaurante',
    category: 'Editorial',
    price: 288300,
    description: 'Tapa y hasta 6 paginas.'
  },
  {
    id: 'pc_edit_8',
    name: 'Manual de instrucciones (Costo x página)',
    category: 'Editorial',
    price: 54700,
    description: 'Costo por página. Tipo revista (incluye desarrollo de infografía o signos simples).'
  },
  {
    id: 'pc_edit_9',
    name: 'Folleto instructivo',
    category: 'Editorial',
    price: 307400,
    description: 'Tipo tríptico A4 con desarrollo de infografía simple o signos.'
  },
  {
    id: 'pc_sign_1',
    name: 'Ploteado vehicular',
    category: 'Señalización',
    price: 261500,
    description: 'Complemento a identidad corporativa/institucional.'
  },
  {
    id: 'pc_sign_2',
    name: 'Ploteado vidriera simple/efímero',
    category: 'Señalización',
    price: 161900,
    description: 'Por temporada, liquidaciones, promociones, etc.'
  },
  {
    id: 'pc_sign_3',
    name: 'Ploteado vidriera complejo/perdurable',
    category: 'Señalización',
    price: 412800,
    description: 'Complemento a identidad corporativa/institucional.'
  },
  {
    id: 'pc_sign_4',
    name: 'Cenefa / Saltarín / Llamador',
    category: 'Señalización',
    price: 207600,
    description: 'Diseño morfológico y gráfico para góndola en punto de venta.'
  },
  {
    id: 'pc_sign_5',
    name: 'Afiche',
    category: 'Señalización',
    price: 207600,
    description: 'Eventos, promociones, etc.'
  },
  {
    id: 'pc_sign_6',
    name: 'Banner',
    category: 'Señalización',
    price: 207600,
    description: 'De pie, colgante, tipo pétalo/gota/wind.'
  },
  {
    id: 'pc_sign_7',
    name: 'Cartel de fachada',
    category: 'Señalización',
    price: 302000,
    description: 'Diseño y asesoramiento en materialización.'
  },
  {
    id: 'pc_sign_8',
    name: 'Cartel para exteriores',
    category: 'Señalización',
    price: 328700,
    description: 'Tipo rutero.'
  },
  {
    id: 'pc_sign_9',
    name: 'Diseño de Sistema señalético y su soporte',
    category: 'Señalización',
    price: 1254600,
    description: 'Hasta 10 piezas (direccionales, locativas, restrictivas, etc.) + manual de aplicación.'
  },
  {
    id: 'pc_ilus_1',
    name: 'Digitalización',
    category: 'Ilustración',
    price: 66300,
    description: 'Escaneado (de ser necesario) y redibujo (logos, tarjetas, etc.). No incluye cambios.'
  },
  {
    id: 'pc_ilus_2',
    name: 'Ilustración mano alzada',
    category: 'Ilustración',
    price: 319500,
    description: 'Para revista / folleto / web.'
  },
  {
    id: 'pc_ilus_3',
    name: 'Ilustración vectorial',
    category: 'Ilustración',
    price: 319500,
    description: 'Para revista / folleto / web.'
  },
  {
    id: 'pc_ilus_4',
    name: 'Ilustración/modelado 3D',
    category: 'Ilustración',
    price: 623400,
    description: 'Para revista / folleto / web.'
  },
  {
    id: 'pc_ilus_5',
    name: 'Animación de personaje o escenario',
    category: 'Ilustración',
    price: 1269000,
    description: 'Hasta 60 segundos. No incluye creación del personaje/escenario.'
  },
  {
    id: 'pc_ilus_6',
    name: 'Desarrollo de sistema de signos',
    category: 'Ilustración',
    price: 1077600,
    description: 'Investigación, análisis, conceptualización y desarrollo de un sistema original y único.'
  },
  {
    id: 'pc_ilus_7',
    name: 'Infografía',
    category: 'Ilustración',
    price: 1344600,
    description: 'Desarrollo complejo.'
  },
  {
    id: 'pc_pack_1',
    name: 'Pack digital presentation',
    category: 'Packaging',
    price: 721800,
    description: 'Tapas, presentación de USB, Memoria, CD o DVD y booklet interior hasta 3 pliegos. No incluye tomas fotográficas.'
  },
  {
    id: 'pc_pack_2',
    name: 'Etiqueta simple',
    category: 'Packaging',
    price: 348800,
    description: 'Etiqueta única aplicada, envoltura simple, impresión sobre envase, bolsa, etc.'
  },
  {
    id: 'pc_pack_3',
    name: 'Etiqueta compuesta',
    category: 'Packaging',
    price: 1038500,
    description: 'Ej. vino: etiqueta + contraetiqueta + cápsula + cuello de botella (si hubiera).'
  },
  {
    id: 'pc_ind_1',
    name: 'Envase',
    category: 'Diseño Industrial',
    price: 1215500,
    description: 'Desarrollo morfológico de estuche troquelado, envase PET, brick, etc. No incluye gráfica.'
  },
  {
    id: 'pc_ind_2',
    name: 'Modelado 3D de envase',
    category: 'Diseño Industrial',
    price: 200100,
    description: 'Costo por envase previamente diseñado. Forma simple (caja, frasco, botella, etc).'
  },
  {
    id: 'pc_ind_3',
    name: 'Renderizado de modelo 3D',
    category: 'Diseño Industrial',
    price: 46800,
    description: 'Precio unitario de cada imagen/vista.'
  },
  {
    id: 'pc_ind_4',
    name: 'Animación de modelo 3D',
    category: 'Diseño Industrial',
    price: 473400,
    description: 'Costo por envase o composición (grupo) de piezas. Hasta 1000 cuadros.'
  },
  {
    id: 'pc_web_1',
    name: 'Modificaciones a sitio WEB HTML/CSS',
    category: 'Web',
    price: 602300,
    description: 'Actualización básica de datos, textos and fotos. No incluye cambios de diseño o agregar secciones.'
  },
  {
    id: 'pc_web_2',
    name: 'Diseño sitio WEB PÁGINA DE ATERRIZAJE',
    category: 'Web',
    price: 179900,
    description: 'La landing page o página de aterrizaje es clave dentro de la planificación estratégica del marketing online. Especialmente diseñada para una rápida y eficaz captación, “sin distracciones”, al grano.'
  },
  {
    id: 'pc_web_3',
    name: 'Maquetación sitio WEB PÁGINA DE ATERRIZAJE',
    category: 'Web',
    price: 409800,
    description: 'Especialmente diseñada para una rápida y eficaz captación, “sin distracciones”, al grano.'
  },
  {
    id: 'pc_web_4',
    name: 'Diseño sitio WEB “One Page”',
    category: 'Web',
    price: 256600,
    description: 'Personalización de colores, tipografía, fotos, iconos, etc.'
  },
  {
    id: 'pc_web_5',
    name: 'Maquetación sitio WEB “One Page”',
    category: 'Web',
    price: 742700,
    description: 'Hasta 3 minimódulos. Estilo sábana, sección descriptiva, formulario de contacto. Adaptativa.'
  },
  {
    id: 'pc_web_6',
    name: 'Diseño sitio WEB “Estándar”',
    category: 'Web',
    price: 327100,
    description: 'Personalización de colores, tipografía, fotos, iconos, etc.'
  },
  {
    id: 'pc_web_7',
    name: 'Maquetación sitio WEB “Estándar”',
    category: 'Web',
    price: 915200,
    description: 'Estilo multipágina o sábana. Hasta 5 secciones, slider animados, mapas de google y conexión a redes sociales.'
  },
  {
    id: 'pc_web_8',
    name: 'Diseño sitio WEB “Completo”',
    category: 'Web',
    price: 395000,
    description: 'Personalización de colores, tipografía, fotos, iconos, etc.'
  },
  {
    id: 'pc_web_9',
    name: 'Maquetación sitio WEB “Completo”',
    category: 'Web',
    price: 1253400,
    description: 'Estilo multipágina o sábana. Hasta 14 secciones, slider animados, mapas de google y conexión a redes sociales.'
  },
  {
    id: 'pc_web_10',
    name: 'Opcional WEB: Sección adicional',
    category: 'Web',
    price: 72700,
    description: 'Costo de maquetado por cada sección extra al pack original.'
  },
  {
    id: 'pc_web_11',
    name: 'Opcional WEB: Sistema autoadministrable / autogestión',
    category: 'Web',
    price: 351500,
    description: 'Sistema autoadministrable de noticias o productos.'
  },
  {
    id: 'pc_web_12',
    name: 'WEB Alta en “Google Mi Negocio”',
    category: 'Web',
    price: 158100,
    description: 'Activar la visualización del negocio/empresa en Google Maps.'
  },
  {
    id: 'pc_web_13',
    name: 'Opcional WEB: Google Analytics',
    category: 'Web',
    price: 158100,
    description: 'Activación de sistema de reportes online de tráfico e integración con Analytics.'
  },
  {
    id: 'pc_web_14',
    name: 'Opcional WEB: Posicionamiento SEO optimizado',
    category: 'Web',
    price: 172300,
    description: 'Lectura avanzada de la codificación del sitio.'
  },
  {
    id: 'pc_web_15',
    name: 'Opcional WEB: Campaña SEM básica',
    category: 'Web',
    price: 172300,
    description: 'Costo mensual. Hasta 500 palabras claves + 1 informe mensual. No incluye inversión en AdWords o similar.'
  },
  {
    id: 'pc_web_16',
    name: 'Armado tienda WEB online (TiendaNube, Wix o similar) 5',
    category: 'Web',
    price: 357600,
    description: 'Darle formato a las plantillas (colores, textos, fotos, etc) y carga de hasta 5 productos.'
  },
  {
    id: 'pc_web_17',
    name: 'Armado tienda WEB online (TiendaNube, Wix o similar) 30',
    category: 'Web',
    price: 539200,
    description: 'Darle formato a las plantillas (colores, textos, fotos, etc) y carga de hasta 30 productos.'
  },
  {
    id: 'pc_web_18',
    name: 'Diseño APP UX (experiencia de usuario)',
    category: 'Web',
    price: 808400,
    description: 'Navegación/usabilidad. Hasta 5 pantallas (vertical/horizontal de c/u) para 1 OS.'
  },
  {
    id: 'pc_web_19',
    name: 'Diseño APP UI (interfase de usuario)',
    category: 'Web',
    price: 808400,
    description: 'Selección y distribución de los elementos. Hasta 5 pantallas (vertical/horizontal de c/u) para 1 OS.'
  },
  {
    id: 'pc_web_20',
    name: 'Maquetación APP (programación Híbrida)',
    category: 'Web',
    price: 808400,
    description: 'Hasta 5 secciones (vertical/horizontal de c/u) para 1 OS.'
  },
  {
    id: 'pc_web_21',
    name: 'Maquetación APP (programación Nativa)',
    category: 'Web',
    price: 1213300,
    description: 'Hasta 5 pantallas (vertical/horizontal de c/u) para 1 OS.'
  },
  {
    id: 'pc_web_22',
    name: 'Banner publicitario animado',
    category: 'Web',
    price: 203600,
    description: 'Animación .gif, Javascript o versión reducida Jquery. Hasta 15 segundos.'
  },
  {
    id: 'pc_web_23',
    name: 'Mailing publicitario / Newsletter',
    category: 'Web',
    price: 177900,
    description: 'Diseño y desarrollo con vínculos activos.'
  },
  {
    id: 'pc_av_1',
    name: 'Placa animada 2D',
    category: 'Audiovisual',
    price: 118200,
    description: 'Texto, fondo y animación. Hasta 10 segundos. No incluye creación ni preparación de elementos.'
  },
  {
    id: 'pc_av_2',
    name: 'Spot publicitario/animación complejidad baja',
    category: 'Audiovisual',
    price: 196500,
    description: 'Edición de tomas y placas estáticas. Hasta 10 segundos. No incluye creación ni preparación de elementos. Sin audio.'
  },
  {
    id: 'pc_av_3',
    name: 'Spot publicitario/animación complejidad media',
    category: 'Audiovisual',
    price: 326700,
    description: 'Edición de tomas y placas animadas. Hasta 10 segundos. No incluye creación ni preparación de elementos. Sin audio.'
  },
  {
    id: 'pc_av_4',
    name: 'Spot publicitario/animación complejidad alta',
    category: 'Audiovisual',
    price: 523200,
    description: 'Edición de tomas y placas animadas + elementos 3D básicos. Hasta 10 segundos. No incluye audio.'
  },
  {
    id: 'pc_av_5',
    name: 'Títulos apertura',
    category: 'Audiovisual',
    price: 196500,
    description: 'Para TV, YouTube, Vimeo, etc. Texto, fondo y animación. Hasta 10 segundos.'
  },
  {
    id: 'pc_av_6',
    name: 'Zócalo',
    category: 'Audiovisual',
    price: 90400,
    description: 'Para TV, YouTube, Vimeo, etc. Texto, fondo y animación. Hasta 10 segundos.'
  },
  {
    id: 'pc_snd_1',
    name: 'Spot radial',
    category: 'Sonido',
    price: 85700,
    description: 'Edición/mezcla, hasta 10 segundos. No incluye grabación de audio/locución.'
  },
  {
    id: 'pc_snd_2',
    name: 'Composición y grabación de música original',
    category: 'Sonido',
    price: 326700,
    description: 'Hasta 1 minuto. No incluye voz/locución.'
  },
  {
    id: 'pc_snd_3',
    name: 'Locución',
    category: 'Sonido',
    price: 65200,
    description: 'Para spot de hasta 10 segundos. No incluye edición.'
  },
  {
    id: 'pc_ph_1',
    name: 'En estudio: armado de set',
    category: 'Fotografía',
    price: 141700,
    description: 'Sesión fotográfica en estudio hasta 2 horas.'
  },
  {
    id: 'pc_ph_2',
    name: 'En locación: sesión fotográfica',
    category: 'Fotografía',
    price: 141700,
    description: 'Hasta 2 horas, 1 cámara para retratos, productos o coberturas.'
  },
  {
    id: 'pc_ph_3',
    name: 'Escaneo digital',
    category: 'Fotografía',
    price: 9600,
    description: 'Costo por unidad de escaneo. No incluye retoques o restauración.'
  },
  {
    id: 'pc_ph_4',
    name: 'Filmación (Costo x hora)',
    category: 'Fotografía',
    price: 154400,
    description: 'Incluye 1 cámara FullHD + 1 micrófono estándar + 1 luz básica.'
  },
  {
    id: 'pc_ph_5',
    name: 'Supervisión de tomas fotográficas (por hora)',
    category: 'Fotografía',
    price: 25000,
    description: 'Asesoramiento en composición de escenas, luz, etc.'
  },
  {
    id: 'pc_ph_6',
    name: 'Retoque digital (x hora)',
    category: 'Fotografía',
    price: 25000,
    description: 'Costo por cada imagen. Fotomontajes, retoque de personas, restauración, etc.'
  }
];

// Preloaded reusable tasks
export const PRELOADED_TASKS: PreloadedTask[] = [
  { id: 'tsk_1', name: 'Reunión de briefing y análisis de objetivos', category: 'Identidad' },
  { id: 'tsk_2', name: 'Creación del Moodboard de inspiración', category: 'Identidad' },
  { id: 'tsk_3', name: 'Presentación de 3 propuestas de isologo', category: 'Identidad' },
  { id: 'tsk_4', name: 'Ajustes finos y definición de manual de marca', category: 'Identidad' },
  { id: 'tsk_5', name: 'Estructura de contenidos y Wireframe UX', category: 'Web' },
  { id: 'tsk_6', name: 'Diseño visual de interfaz (Figma)', category: 'Web' },
  { id: 'tsk_7', name: 'Desarrollo frontend interactivo responsive', category: 'Web' },
  { id: 'tsk_8', name: 'Carga de catálogo, envíos y pasarela de pago', category: 'Web' },
  { id: 'tsk_9', name: 'Testing general, optimización SEO de velocidad', category: 'Web' },
  { id: 'tsk_10', name: 'Publicación de lanzamiento y entrega de accesos', category: 'Web' },
  { id: 'tsk_11', name: 'Elaboración de calendario de contenidos mensual', category: 'Marketing' },
  { id: 'tsk_12', name: 'Diseño de plantillas visuales aprobadas', category: 'Marketing' }
];

// Initial seeded clients
export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Sofía Martínez',
    category: 'B',
    company: 'Mandarina Café',
    email: 'contacto@mandarinacafe.com',
    phone: '341-5829302',
    address: 'Bv. Oroño 1230, Rosario',
    notes: 'Estudio de cafetería de especialidad y pastelería de autor. Requieren branding completo y su landing web.',
    hasWebServices: true,
    webData: {
      url: 'https://mandarinacafe.com',
      username: 'admin@mandarinacafe.com',
      password: 'CoffeeLove2026!',
      hostingInfo: 'DonWeb - VPS Plan Inicial - Vence 15/12/2026',
      notes: 'Dominio delegándose en Nic.ar. WordPress administrable con panel Elementor.'
    },
    createdAt: '2026-02-10'
  },
  {
    id: 'cli_2',
    name: 'Carlos Bianchi',
    category: 'A',
    company: 'Constructora Horizontes',
    email: 'cbianchi@constructorahorizontes.com.ar',
    phone: '11-65481234',
    address: 'Av. del Libertador 4500, CABA',
    notes: 'Estudio de arquitectura y desarrollos inmobiliarios de pozo. Imagen corporativa premium.',
    hasWebServices: false,
    webData: {},
    createdAt: '2026-03-01'
  },
  {
    id: 'cli_3',
    name: 'Laura Gadea',
    category: 'C',
    company: 'Estética Aura',
    email: 'laura.aura@gmail.com',
    phone: '351-4091211',
    address: 'Rafael Nuñez 2040, Córdoba',
    notes: 'Centro de estética y spa boutique. Pack de redes activo permanente.',
    hasWebServices: false,
    webData: {},
    createdAt: '2026-04-15'
  }
];

// Initial Budgets (linked to clients, using preloaded pieces)
export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'PP-2026-001',
    clientId: 'cli_1',
    clientName: 'Sofía Martínez (Mandarina Café)',
    date: '2026-02-12',
    items: [
      { id: 'pc_id_1', name: 'Nueva Identidad Corporativa', price: 1160200, quantity: 1, subtotal: 1160200 },
      { id: 'pc_web_5', name: 'Maquetación sitio WEB “One Page”', price: 742700, quantity: 1, subtotal: 742700 }
    ],
    total: 1902900,
    notes: 'Se presupuestó branding con manual detallado y el diseño completo de la web autoadministrable. Se pactó el pago en dos partes: 50% al aceptar y 50% al entregar.',
    status: 'Aprobado',
    paymentStatus: 'Parcial',
    payments: [
      { id: 'pay_1', date: '2026-02-14', amount: 950000, method: 'Transferencia bancaria', notes: 'Seña inicial para dar comienzo al proyecto.' }
    ]
  },
  {
    id: 'PP-2026-002',
    clientId: 'cli_2',
    clientName: 'Carlos Bianchi (Constructora Horizontes)',
    date: '2026-03-05',
    items: [
      { id: 'pc_id_1', name: 'Nueva Identidad Corporativa', price: 1160200, quantity: 1, subtotal: 1160200 },
      { id: 'pc_pap_1', name: 'Papelería básica', price: 373600, quantity: 1, subtotal: 373600 },
      { id: 'pc_pub_5', name: 'Brochure', price: 692300, quantity: 1, subtotal: 692300 }
    ],
    total: 2226100,
    notes: 'Presupuesto corporativo para constructora. Incluye folletería básica y plantilla Pitch Deck listo para inversores.',
    status: 'Aprobado',
    paymentStatus: 'Completo',
    payments: [
      { id: 'pay_2', date: '2026-03-07', amount: 1200000, method: 'Transferencia bancaria', notes: 'Primer pago de inicio' },
      { id: 'pay_3', date: '2026-04-10', amount: 1026100, method: 'Transferencia bancaria', notes: 'Saldo final contra entrega del Brandbook y PDF aprobado' }
    ]
  },
  {
    id: 'PP-2026-003',
    clientId: 'cli_3',
    clientName: 'Laura Gadea (Estética Aura)',
    date: '2026-04-18',
    items: [
      { id: 'pc_cm_6', name: 'Administración/Gestión estándar de RRSS', price: 268600, quantity: 2, subtotal: 537200 }
    ],
    total: 537200,
    notes: 'Pack de redes sociales correspondiente a Mayo y Junio adelantados con descuento por abono.',
    status: 'Aprobado',
    paymentStatus: 'Pendiente',
    payments: []
  },
  {
    id: 'PP-2026-004',
    clientId: 'cli_1',
    clientName: 'Sofía Martínez (Mandarina Café)',
    date: '2026-06-01',
    items: [
      { id: 'pc_web_22', name: 'Banner publicitario animado', price: 203600, quantity: 1, subtotal: 203600 }
    ],
    total: 203600,
    notes: 'Banners promocionales para el lanzamiento de invierno de la cafetería.',
    status: 'Borrador',
    paymentStatus: 'Pendiente',
    payments: []
  }
];

// Initial seeded Projects (some tied to approved budgets)
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj_1',
    clientId: 'cli_1',
    clientName: 'Mandarina Café',
    name: 'Identidad Visual & Landing Mandarina',
    description: 'Creación de imagen integral de marca y el desarrollo de landing page promocional con menú interactivo de repostería.',
    budgetId: 'PP-2026-001',
    status: 'En Progreso',
    startDate: '2026-02-15',
    tasks: [
      { id: 't_1', name: 'Definir brief de marca y reunión de kickoff', completed: true },
      { id: 't_2', name: 'Presentación de propuestas de logotipo', completed: true },
      { id: 't_3', name: 'Redactar manual de marca e identidad gráfica', completed: true },
      { id: 't_4', name: 'Esquematizar wireframe de la landing page', completed: true },
      { id: 't_5', name: 'Desarrollo interactivo y carga estética local', completed: false },
      { id: 't_6', name: 'Revisión final con Sofía y lanzamiento online', completed: false }
    ],
    pieces: [
      { id: 'pc_id_1', name: 'Nueva Identidad Corporativa', price: 1160200, quantity: 1, subtotal: 1160200 },
      { id: 'pc_web_5', name: 'Maquetación sitio WEB “One Page”', price: 742700, quantity: 1, subtotal: 742700 }
    ]
  },
  {
    id: 'prj_2',
    clientId: 'cli_2',
    clientName: 'Constructora Horizontes',
    name: 'Branding e Identidad Corporativa',
    description: 'Diseño de logotipo formal, carpetas institucionales corporativas y plantilla Pitch Deck para inversores de obras inmobiliarias.',
    budgetId: 'PP-2026-002',
    status: 'Completado',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    tasks: [
      { id: 't_21', name: 'Kickoff meeting y análisis de competidores directos', completed: true },
      { id: 't_22', name: 'Propuestas de logotipo sobrias y de construcción', completed: true },
      { id: 't_23', name: 'Diseño de papelería institucional y sobres', completed: true },
      { id: 't_24', name: 'Maquetar slides del Pitch Deck de inversor', completed: true },
      { id: 't_25', name: 'Exportar archivos en PDF de alta y manuales editables', completed: true }
    ],
    pieces: [
      { id: 'pc_id_1', name: 'Nueva Identidad Corporativa', price: 1160200, quantity: 1, subtotal: 1160200 },
      { id: 'pc_pap_1', name: 'Papelería básica', price: 373600, quantity: 1, subtotal: 373600 },
      { id: 'pc_pub_5', name: 'Brochure', price: 692300, quantity: 1, subtotal: 692300 }
    ]
  },
  {
    id: 'prj_3',
    clientId: 'cli_3',
    clientName: 'Estética Aura',
    name: 'Estrategia Social Media Mayo/Junio',
    description: 'Generación periódica de grilla visual interactiva y copys creativos para capturar turnos por Instagram.',
    budgetId: 'PP-2026-003',
    status: 'En Progreso',
    startDate: '2026-04-20',
    tasks: [
      { id: 't_31', name: 'Definir estética visual, tipografías e iconografía', completed: true },
      { id: 't_32', name: 'Generación de la grilla de contenido del mes 1', completed: true },
      { id: 't_33', name: 'Diseño de piezas gráficas y carruseles del mes 1', completed: true },
      { id: 't_34', name: 'Redactar pies de foto y preparar hashtags sugeridos', completed: true },
      { id: 't_35', name: 'Planificar grilla del mes 2 (Junio) en curso', completed: false },
      { id: 't_36', name: 'Sugerencia de reels semanales con audio en tendencia', completed: false }
    ],
    pieces: [
      { id: 'pc_cm_6', name: 'Administración/Gestión estándar de RRSS', price: 268600, quantity: 2, subtotal: 537200 }
    ]
  }
];

// Helper functions to manage localStorage data
const LS_KEYS = {
  CLIENTS: 'unke_clients',
  PIECES: 'unke_pieces',
  TASKS: 'unke_tasks',
  BUDGETS: 'unke_budgets',
  PROJECTS: 'unke_projects'
};

export function getStoredData() {
  // Read or initialize
  const clients = localStorage.getItem(LS_KEYS.CLIENTS);
  const pieces = localStorage.getItem(LS_KEYS.PIECES);
  const tasks = localStorage.getItem(LS_KEYS.TASKS);
  const budgets = localStorage.getItem(LS_KEYS.BUDGETS);
  const projects = localStorage.getItem(LS_KEYS.PROJECTS);

  return {
    clients: clients ? JSON.parse(clients) : INITIAL_CLIENTS,
    pieces: pieces ? JSON.parse(pieces) : PRELOADED_PIECES,
    tasks: tasks ? JSON.parse(tasks) : PRELOADED_TASKS,
    budgets: budgets ? JSON.parse(budgets) : INITIAL_BUDGETS,
    projects: projects ? JSON.parse(projects) : INITIAL_PROJECTS
  };
}

export function saveStoredData(data: {
  clients?: Client[];
  pieces?: DesignPiece[];
  tasks?: PreloadedTask[];
  budgets?: Budget[];
  projects?: Project[];
}) {
  if (data.clients) localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(data.clients));
  if (data.pieces) localStorage.setItem(LS_KEYS.PIECES, JSON.stringify(data.pieces));
  if (data.tasks) localStorage.setItem(LS_KEYS.TASKS, JSON.stringify(data.tasks));
  if (data.budgets) localStorage.setItem(LS_KEYS.BUDGETS, JSON.stringify(data.budgets));
  if (data.projects) localStorage.setItem(LS_KEYS.PROJECTS, JSON.stringify(data.projects));
}

export function resetToDefaults() {
  localStorage.setItem(LS_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  localStorage.setItem(LS_KEYS.PIECES, JSON.stringify(PRELOADED_PIECES));
  localStorage.setItem(LS_KEYS.TASKS, JSON.stringify(PRELOADED_TASKS));
  localStorage.setItem(LS_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
  localStorage.setItem(LS_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
}

const CAMPUS_COORDS = [10.1345, -85.4467];

const CLASSROOMS = [
  {
    id: "aula-16",
    name: "Aula 16",
    building: "Zona Colegio Humanístico",
    floor: "Primer piso",
    lat: 10.135646,
    lng: -85.446688,
    reference: "Está detrás de las aulas del Colegio Humanístico.",
    instructions: [
      "Sigue la ruta marcada en el mapa hacia la zona del Colegio Humanístico.",
      "Cuando llegues al área del Humanístico, continúa hacia la parte de atrás.",
      "Permanece en el primer piso y busca el rótulo del Aula 16."
    ]
  },
  {
    id: "aula-17",
    name: "Aula 17",
    building: "Zona Colegio Humanístico",
    floor: "Primer piso",
    lat: 10.135588,
    lng: -85.446777,
    reference: "Está a la par del Aula 16, cerca del Colegio Humanístico.",
    instructions: [
      "Dirígete hacia la zona del Colegio Humanístico siguiendo la ruta del mapa.",
      "Ubica el Aula 16 como referencia principal.",
      "El Aula 17 se encuentra a la par, en el primer piso."
    ]
  },
  {
    id: "colegio-humanistico",
    name: "Colegio Humanístico",
    building: "Colegio Humanístico",
    floor: "Primer piso",
    lat: 10.135435,
    lng: -85.446716,
    reference: "Edificio principal del Colegio Humanístico.",
    instructions: [
      "Camina hacia el punto marcado del Colegio Humanístico.",
      "Busca el edificio identificado como Colegio Humanístico.",
      "Ingresa por la entrada principal del edificio."
    ]
  },
  {
    id: "soda",
    name: "Soda",
    building: "Área de Soda",
    floor: "Segundo piso",
    lat: 10.134068,
    lng: -85.446529,
    reference: "Zona de alimentación del campus.",
    instructions: [
      "Sigue la ruta marcada hacia la zona de la Soda.",
      "Cuando llegues al edificio, busca las gradas o acceso al segundo piso.",
      "Sube al segundo piso y ubica el área de la Soda."
    ]
  },
  {
    id: "kiosko",
    name: "Kiosko",
    building: "Área de Kiosko",
    floor: "Segundo piso",
    lat: 10.134154,
    lng: -85.446728,
    reference: "Punto cercano a la zona central del campus.",
    instructions: [
      "Camina hacia el punto marcado como Kiosko.",
      "Al llegar al edificio o zona indicada, busca el acceso al segundo piso.",
      "Sube al segundo piso y ubica el Kiosko."
    ]
  },
  {
    id: "aula-1",
    name: "Aula 1",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134693,
    lng: -85.446639,
    reference: "Ubicada en el segundo piso del pabellón de aulas.",
    instructions: [
      "Sigue la ruta marcada hacia el pabellón de aulas.",
      "Busca las gradas o rampa de acceso al segundo piso.",
      "Sube al segundo piso y busca el rótulo del Aula 1."
    ]
  },
  {
    id: "aula-2",
    name: "Aula 2",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134705,
    lng: -85.446716,
    reference: "Ubicada cerca del Aula 1, en el segundo piso.",
    instructions: [
      "Dirígete al pabellón de aulas siguiendo el mapa.",
      "Sube al segundo piso por las gradas o rampa.",
      "Busca el Aula 2 en el pasillo principal."
    ]
  },
  {
    id: "aula-3",
    name: "Aula 3",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134658,
    lng: -85.446802,
    reference: "Ubicada en el segundo piso del pabellón.",
    instructions: [
      "Avanza hacia el pabellón de aulas.",
      "Sube al segundo piso.",
      "Recorre el pasillo y busca el rótulo del Aula 3."
    ]
  },
  {
    id: "aula-4",
    name: "Aula 4",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134587,
    lng: -85.446824,
    reference: "Ubicada después del Aula 3, en el segundo piso.",
    instructions: [
      "Sigue la ruta hacia el pabellón de aulas.",
      "Sube al segundo piso.",
      "Busca el Aula 4 en el pasillo del pabellón."
    ]
  },
  {
    id: "aula-5",
    name: "Aula 5",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134513,
    lng: -85.446788,
    reference: "Ubicada en el segundo piso del pabellón de aulas.",
    instructions: [
      "Camina hacia el pabellón de aulas.",
      "Sube al segundo piso por el acceso más cercano.",
      "Ubica el Aula 5 revisando los rótulos del pasillo."
    ]
  },
  {
    id: "aula-6",
    name: "Aula 6",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134493,
    lng: -85.446702,
    reference: "Ubicada cerca del Aula 5 y Aula 7.",
    instructions: [
      "Dirígete hacia el pabellón de aulas.",
      "Sube al segundo piso.",
      "Busca el Aula 6 en la zona central del pasillo."
    ]
  },
  {
    id: "aula-7",
    name: "Aula 7",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134530,
    lng: -85.446626,
    reference: "Ubicada en el segundo piso, cerca del Aula 8.",
    instructions: [
      "Sigue la ruta marcada hacia el pabellón.",
      "Sube al segundo piso.",
      "Busca el Aula 7 cerca del Aula 8."
    ]
  },
  {
    id: "aula-8",
    name: "Aula 8",
    building: "Pabellón de Aulas",
    floor: "Segundo piso",
    lat: 10.134602,
    lng: -85.446604,
    reference: "Ubicada en el segundo piso del pabellón.",
    instructions: [
      "Camina hacia el pabellón de aulas.",
      "Sube al segundo piso.",
      "Ubica el Aula 8 revisando los rótulos del pasillo."
    ]
  },
  {
    id: "aula-9",
    name: "Aula 9",
    building: "Pabellón de Aulas",
    floor: "Tercer piso",
    lat: 10.134341,
    lng: -85.447093,
    reference: "Ubicada en el tercer piso del pabellón.",
    instructions: [
      "Sigue la ruta marcada hacia el pabellón correspondiente.",
      "Al llegar al edificio, busca las gradas o rampa hacia el tercer piso.",
      "Sube al tercer piso y busca el rótulo del Aula 9."
    ]
  },
  {
    id: "aula-10",
    name: "Aula 10",
    building: "Pabellón de Aulas",
    floor: "Tercer piso",
    lat: 10.134244,
    lng: -85.447127,
    reference: "Ubicada cerca del Aula 9, en el tercer piso.",
    instructions: [
      "Dirígete hacia el pabellón indicado en el mapa.",
      "Sube hasta el tercer piso.",
      "Busca el Aula 10 cerca del Aula 9."
    ]
  }
];
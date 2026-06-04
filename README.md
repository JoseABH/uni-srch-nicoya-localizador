# UNI SRCH Nicoya - Localizador de Aulas

Prototipo web responsive para localizar aulas dentro del campus UNA SRCH Nicoya.

## Funciones

- Mapa interactivo con Leaflet y OpenStreetMap.
- Geolocalización del navegador con alta precisión.
- Selección de aulas simuladas.
- Ruta lineal entre usuario y destino.
- Distancia aproximada en metros.
- Indicaciones textuales por edificio, referencia y piso.
- Modo AirTag para acercarse al destino usando distancia, estado y flecha de orientación.
- Diseño responsive para celular, tablet y escritorio.

## Archivos

- `index.html`: estructura principal.
- `styles.css`: diseño responsive y modo AirTag.
- `data.js`: aulas y coordenadas simuladas.
- `app.js`: lógica del mapa, GPS, ruta, distancia e indicaciones.

## Nota importante

El GPS puede guiar al punto del edificio, pero no puede detectar de forma confiable si el aula está en primer o segundo piso. Por eso cada aula incluye instrucciones textuales internas.

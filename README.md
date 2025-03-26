# Hashkelly - App de Sorteo Benéfico

Aplicación web para gestionar el sorteo de una rifa benéfica, mostrando los números disponibles, realizando el sorteo en vivo y gestionando los ganadores.

![Hashkelly Screenshot](https://via.placeholder.com/800x400?text=Hashkelly+Sorteo+App)

## 🚀 Características

- Visualización de números de rifa en una grilla interactiva
- Muestra iniciales de los compradores en cada número vendido
- Sistema de sorteo animado con efecto "ruleta"
- Confeti para celebrar cada ganador
- Soporte para 3 premios (Cafetera, Sanguchera, Miniprocesadora)
- Modo de visualización adaptado para eventos en vivo
- Carga de participantes desde un archivo CSV

## 🛠️ Tecnologías

- [React](https://reactjs.org/) - Biblioteca JavaScript para interfaces de usuario
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado de JavaScript
- [Vite](https://vitejs.dev/) - Herramienta de compilación ultrarrápida
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitario
- [Papa Parse](https://www.papaparse.com/) - Biblioteca para análisis de CSV
- [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) - Efectos visuales de celebración

## 📋 Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (normalmente viene con Node.js)

## 🔧 Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/hashkelly.git
   cd hashkelly
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Asegúrate de tener el archivo de participantes:
   - Coloca tu archivo `participantes.csv` en la carpeta `/public`
   - Formato requerido: `numero,nombre,telefono`

## 💻 Desarrollo local

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:5173](http://localhost:5173)

## 📦 Compilación para producción

Para generar los archivos de producción:

```bash
npm run build
```

Los archivos compilados se generarán en el directorio `dist/`

## 🚢 Despliegue

### Vercel

La forma más sencilla de desplegar esta aplicación es utilizando [Vercel](https://vercel.com/):

1. Crea una cuenta en Vercel si aún no tienes una
2. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Ejecuta el comando de despliegue desde la raíz del proyecto:
   ```bash
   vercel
   ```
4. Sigue las instrucciones en pantalla

O simplemente conecta tu repositorio de GitHub a Vercel para despliegues automáticos.

## 📁 Estructura del proyecto

```
.
├── public/
│   ├── participantes.csv    # Archivo CSV con los datos de la rifa
│   └── ...
├── src/
│   ├── components/
│   │   └── SorteoApp.tsx    # Componente principal del sorteo
│   ├── App.tsx              # Componente raíz de la aplicación
│   ├── main.tsx             # Punto de entrada de la aplicación
│   └── ...
├── .vercelignore            # Archivos a ignorar en el despliegue
├── package.json
└── ...
```

## 📝 Notas para desarrolladores

- El componente `SorteoApp.tsx` contiene toda la lógica de la aplicación
- Los datos de los participantes se cargan desde `/public/participantes.csv`
- Si el archivo CSV no se encuentra, se usarán datos de ejemplo
- La aplicación está diseñada para 200 números de rifa, de los cuales 150 están vendidos
- Se sortean exactamente 3 premios

## ⚠️ Solución de problemas comunes

### Error al compilar con TypeScript

Si encuentras errores de TypeScript similares a:

```
Cannot find module './components/SorteoApp' or its corresponding type declarations
```

Asegúrate de que el archivo `SorteoApp.tsx` está en el directorio correcto: `src/components/`

### Problemas al cargar el CSV

Si la aplicación no puede leer el archivo CSV:

1. Verifica que el archivo esté en la carpeta `/public`
2. Confirma que el formato es correcto: `numero,nombre,telefono`
3. Asegúrate que el nombre del archivo sea `participantes.csv`

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir lo que te gustaría cambiar o añadir.

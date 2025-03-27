import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';

// interfaces
interface Participante {
  numero: number;
  nombre: string;
  telefono: string;
  [key: string]: any; 
}

interface NumeroRifa {
  numero: number;
  vendido: boolean;
  nombre: string;
  telefono: string;
}

interface Premio {
  id: number;
  nombre: string;
  sorteado: boolean;
  numeroGanador: number | null;
  sorteando: boolean;
}

const SorteoApp: React.FC = () => {
  // Estados con tipado
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [vista, setVista] = useState<'grilla' | 'sorteo'>('grilla');
  const [modoFiesta, setModoFiesta] = useState<boolean>(false);
  
  // Premios con su estado
  const [premios, setPremios] = useState<Premio[]>([
    { id: 1, nombre: "Cafetera", sorteado: false, numeroGanador: null, sorteando: false },
    { id: 2, nombre: "Minipymer", sorteado: false, numeroGanador: null, sorteando: false },
    { id: 3, nombre: "Sanguchera", sorteado: false, numeroGanador: null, sorteando: false }
  ]);
  
  // Número de WhatsApp para contacto
  const numeroWhatsApp = "+56947366008";

  useEffect(() => {
    // fn para cargar el CSV desde /public
    async function cargarCSV(): Promise<void> {
      try {
        const response = await fetch('/participantes.csv');
        const texto = await response.text();
        
        Papa.parse<Participante>(texto, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setParticipantes(results.data);
            console.log('Datos cargados:', results.data.length, 'participantes');
          },
          error: (error: Error) => {
            console.error('Error al parsear CSV:', error);
          }
        });
      } catch (error: unknown) {
        console.error('Error al cargar el archivo CSV:', error);
        // Fallback porsi porsi
        const csvSimulado = `numero,nombre,telefono
1,Juan Pérez,+5691122334455
2,María López,+5691123456789
3,Juan Pérez,+5691122334455
4,Carlos Gómez,+5691187654321
5,Ana Martínez,+5691145678901
`;
        Papa.parse<Participante>(csvSimulado, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setParticipantes(results.data);
            console.log('Usando datos simulados');
          }
        });
      }
    }
    
    cargarCSV();
  }, []);

  useEffect(() => {
    const todosLosPremiossortados = premios.every(premio => premio.sorteado);
    
    if (todosLosPremiossortados && premios.some(p => p.sorteado)) {
      console.log("TODOS LOS PREMIOS SORTEADOS - ¡ACTIVANDO FIESTA!");
      setModoFiesta(true);
      
      const lanzarConfettiFiesta = () => {
        lanzarConfetti(1.5);
        setTimeout(() => lanzarConfetti(2), 300);
        setTimeout(() => lanzarConfetti(2.5), 600);
      };
      
      lanzarConfettiFiesta();
      
      const intervalId = setInterval(() => {
        lanzarConfetti(Math.random() * 2 + 1);
      }, 800);
      
      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(intervalId);
    }
  }, [premios]);

  // Función para generar todos los números de la rifa (1-200)
  const generarNumeros = (): NumeroRifa[] => {
    const numeros: NumeroRifa[] = [];
    
    // Generamos exactamente 200 números
    for (let i = 1; i <= 200; i++) {
      const participante = participantes.find(p => Number(p.numero) === i);
      
      numeros.push({
        numero: i,
        vendido: !!participante, 
        nombre: participante ? participante.nombre : '',
        telefono: participante ? participante.telefono : ''
      });
    }
    
    // Verificamos y hacemos un log de cuántos números vendidos hay
    const vendidos = numeros.filter(n => n.vendido).length;
    console.log(`Números vendidos: ${vendidos} de 200`);
    
    return numeros;
  };

  // Obtener números ganadores
  const obtenerNumerosGanadores = (): number[] => {
    return premios
      .filter(premio => premio.sorteado && premio.numeroGanador !== null)
      .map(premio => premio.numeroGanador!)
      .filter(numero => numero !== null);
  };

  // Función para obtener enlace a WhatsApp
  const obtenerEnlaceWhatsApp = (numero: number): string => {
    const mensaje = encodeURIComponent(`aiskely, quiero comprar el número ${numero}`);
    return `https://wa.me/${numeroWhatsApp.replace(/\D/g, '')}?text=${mensaje}`;
  };

  // Función para lanzar confetti
  const lanzarConfetti = (intensidad: number = 1, origin: { x?: number, y?: number } = { y: 0.6 }): void => {
    confetti({
      particleCount: 100 * intensidad,
      spread: 70 + (intensidad * 10),
      origin: origin,
      colors: modoFiesta ? ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'] : undefined
    });
  };

  // fn para iniciales
  const obtenerIniciales = (nombre: string): string => {
    if (!nombre) return '';
    return nombre
      .split(' ')
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase();
  };

  const sortearPremio = (premioId: number): void => {
    setPremios(prevPremios => 
      prevPremios.map(premio => 
        premio.id === premioId 
          ? { ...premio, sorteando: true } 
          : premio
      )
    );
    
    setNumeroActual(null);
    
    const numerosYaGanadores = obtenerNumerosGanadores();
    
    const numerosVendidos = generarNumeros()
      .filter(n => n.vendido && !numerosYaGanadores.includes(n.numero));
    
    // Si no hay más números disponibles, terminamos
    if (numerosVendidos.length === 0) {
      setPremios(prevPremios => 
        prevPremios.map(premio => 
          premio.id === premioId 
            ? { ...premio, sorteando: false } 
            : premio
        )
      );
      return;
    }

    let contador = 0;
    const intervalId = setInterval(() => {
      const indiceAleatorio = Math.floor(Math.random() * numerosVendidos.length);
      setNumeroActual(numerosVendidos[indiceAleatorio].numero);
      
      contador++;
      if (contador > 20) { // Después de 20 iteraciones, paramos
        clearInterval(intervalId);
        const numeroGanador = numerosVendidos[indiceAleatorio].numero;
        
        // Actualizamos el premio con su ganador
        setPremios(prevPremios => 
          prevPremios.map(premio => 
            premio.id === premioId 
              ? { 
                  ...premio, 
                  sorteando: false, 
                  sorteado: true, 
                  numeroGanador: numeroGanador 
                } 
              : premio
          )
        );
        
        // Lanzar confetti para celebrar este premio
        lanzarConfetti();
      }
    }, 100);
  };

  // Reiniciar todos los sorteos
  const reiniciarSorteos = (): void => {
    setPremios([
      { id: 1, nombre: "Cafetera", sorteado: false, numeroGanador: null, sorteando: false },
      { id: 2, nombre: "Minipymer", sorteado: false, numeroGanador: null, sorteando: false },
      { id: 3, nombre: "Sanguchera", sorteado: false, numeroGanador: null, sorteando: false }
    ]);
    setNumeroActual(null);
    setModoFiesta(false);
  };

  const renderizarGrilla = (): JSX.Element => {
    const numeros = generarNumeros();
    const numerosGanadores = obtenerNumerosGanadores();
    
    const totalNumeros = 200;
    
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Números de Rifa</h2>
        
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Números vendidos: {numeros.filter(n => n.vendido).length} de {totalNumeros}
          </p>
        </div>
        
        {/* Contenedor para grid */}
        <div className="w-full overflow-hidden">
          {/* Grid con filas y columnas explícitas para mayor compatibilidad */}
          <div 
            className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4"
          >
            {numeros.slice(0, totalNumeros).map(num => (
              num.vendido ? (
                <div 
                  key={num.numero}
                  className={`
                    aspect-square p-2 rounded-lg text-center relative transition-all
                    bg-green-100 hover:bg-green-200
                    ${numerosGanadores.includes(num.numero) ? 'ring-2 ring-yellow-400' : ''}
                    flex flex-col items-center justify-center
                  `}
                  title={`${num.numero}: ${num.nombre} (${num.telefono})`}
                >
                  <div className="font-bold">{num.numero}</div>
                  {num.vendido && (
                    <div className="text-xs">{obtenerIniciales(num.nombre)}</div>
                  )}
                  {numerosGanadores.includes(num.numero) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full" title="¡Ganador!"></div>
                  )}
                </div>
              ) : (
                <a 
                  href={obtenerEnlaceWhatsApp(num.numero)}
                  key={num.numero}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    aspect-square p-2 rounded-lg text-center relative transition-all
                    bg-gray-100 hover:bg-gray-200 hover:text-blue-600
                    flex flex-col items-center justify-center
                  `}
                  title={`Comprar número ${num.numero}`}
                >
                  <div className="font-bold">{num.numero}</div>
                  <div className="text-xs text-gray-500">Comprar</div>
                </a>
              )
            ))}
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 flex justify-center gap-4 text-sm flex-wrap">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-1"></div>
            <span>Vendido</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-1"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 ring-2 ring-yellow-400 rounded mr-1 relative">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
            <span>Ganador</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de la vista de sorteo
  const renderizarSorteo = (): JSX.Element => {
    // Calculamos cuántos premios han sido sorteados
    const premiosSorteados = premios.filter(premio => premio.sorteado).length;
    const todosLosPremiossortados = premios.every(premio => premio.sorteado);
    const algunoSorteando = premios.some(premio => premio.sorteando);
    
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Rifa en Vivo</h2>
        
        {/* Mostrar el número actual si algún premio está sorteándose */}
        {algunoSorteando && (
          <div className="mb-6">
            <div className={`text-6xl font-bold m-4 p-6 bg-yellow-100 rounded-lg inline-block min-w-32 ${algunoSorteando ? 'animate-pulse' : ''}`}>
              {numeroActual || '?'}
            </div>
          </div>
        )}
        
        {/* Tarjetas de premios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-6">
          {premios.map((premio) => {
            // Determinar el estilo y contenido según el estado
            let colorFondo = 'bg-gray-100';
            let textoPrincipal = <span>Pendiente</span>;
            let botonSorteo = null;
            
            // Si el premio está siendo sorteado
            if (premio.sorteando) {
              colorFondo = 'bg-yellow-100 animate-pulse';
              textoPrincipal = <span className="font-bold">Sorteando...</span>;
            }
            // Si el premio ya ha sido sorteado
            else if (premio.sorteado) {
              colorFondo = 'bg-green-100';
              const ganador = participantes.find(p => Number(p.numero) === premio.numeroGanador);
              textoPrincipal = (
                <div>
                  <div className="font-bold text-2xl mb-1">{premio.numeroGanador}</div>
                  {ganador && (
                    <>
                      <div>{ganador.nombre}</div>
                      <div className="text-sm text-gray-600">{ganador.telefono}</div>
                    </>
                  )}
                </div>
              );
            }
            // Si el premio aún no ha sido sorteado
            else {
              botonSorteo = (
                <button
                  onClick={() => sortearPremio(premio.id)}
                  disabled={algunoSorteando}
                  className={`
                    mt-4 px-4 py-2 rounded-lg text-white font-bold
                    ${algunoSorteando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
                  `}
                >
                  Sortear Este Premio
                </button>
              );
            }
            
            return (
              <div 
                key={premio.id}
                className={`p-4 rounded-lg shadow-md transition-all ${colorFondo} ${premio.sorteado ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="bg-blue-500 text-white py-2 px-3 rounded-full text-sm font-bold inline-block mb-3">
                  Premio #{premio.id}
                </div>
                <h3 className="text-xl font-bold mb-3">{premio.nombre}</h3>
                
                <div className="mb-2">
                  {textoPrincipal}
                </div>
                
                {botonSorteo}
              </div>
            );
          })}
        </div>
        
        {/* Botón para reiniciar todos los sorteos */}
        {(premiosSorteados > 0) && (
          <button
            onClick={reiniciarSorteos}
            disabled={algunoSorteando}
            className={`
              p-3 rounded-lg text-white font-bold text-lg mt-4
              ${algunoSorteando ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}
              ${todosLosPremiossortados && modoFiesta ? 'animate-bounce' : ''}
            `}
          >
            Reiniciar Todos los Sorteos
          </button>
        )}
        
        {/* Mensaje informativo sobre el estado del sorteo */}
        <div className="mt-6 text-gray-600">
          {todosLosPremiossortados ? (
            <div className="font-bold text-lg text-green-600">¡Todos los premios han sido sorteados!</div>
          ) : (
            <p>Premios sorteados: {premiosSorteados} de 3</p>
          )}
        </div>
      </div>
    );
  };

  // Calcular estadísticas sobre los números vendidos
  const numerosVendidos = generarNumeros().filter(n => n.vendido).length;

  return (
    <div className={`max-w-4xl mx-auto p-4 transition-colors duration-300 ${modoFiesta ? 'modo-fiesta' : ''}`}>
      {/* Estilos para la animación de luces de fiesta - SIEMPRE PRESENTES */}
      <style>
        {`
          @keyframes cambioColores {
            0% { background-color: rgba(255, 215, 0, 0.6); }
            20% { background-color: rgba(255, 105, 180, 0.6); }
            40% { background-color: rgba(138, 43, 226, 0.6); }
            60% { background-color: rgba(30, 144, 255, 0.6); }
            80% { background-color: rgba(50, 205, 50, 0.6); }
            100% { background-color: rgba(255, 69, 0, 0.6); }
          }
          
          .modo-fiesta {
            animation: cambioColores 0.8s infinite;
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
          }
        `}
      </style>
      
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center text-blue-600">Hashkelly - Rifa a beneficio</h1>
        
        {/* Nuevo botón de WhatsApp */}
        <div className="text-center mt-2 mb-4">
          <a
            href={`https://wa.me/${numeroWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero comprar números para la rifa a beneficio')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Comprar números
          </a>
        </div>
        
        <p className="text-center text-gray-600">
          ¡{numerosVendidos} números vendidos de 200! - 3 super premios a sortear
        </p>
        
        <nav className="flex justify-center mt-4 gap-2 flex-wrap">
          <button 
            onClick={() => setVista('grilla')}
            className={`px-4 py-2 rounded ${vista === 'grilla' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-200'}`}
          >
            Grilla de Números
          </button>
          <button 
            onClick={() => setVista('sorteo')}
            className={`px-4 py-2 rounded ${vista === 'sorteo' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-200'}`}
          >
            Realizar Sorteo
          </button>
          
          {/* Botón para probar el modo fiesta */}
          <button 
            onClick={() => {
              setModoFiesta(!modoFiesta);
              if (!modoFiesta) {
                console.log("Modo fiesta activado manualmente");
                // Al activar, iniciamos los confetti
                lanzarConfetti(1);
                setTimeout(() => lanzarConfetti(1.5), 300);
                setTimeout(() => lanzarConfetti(2), 600);
                
                // Temporizador para desactivar
                setTimeout(() => {
                  console.log("Desactivando modo fiesta automáticamente");
                  setModoFiesta(false);
                }, 10000);
              } else {
                console.log("Modo fiesta desactivado manualmente");
              }
            }}
            className="px-4 py-2 rounded bg-purple-500 hover:bg-purple-600 text-white"
            title="Prueba el efecto de luces de fiesta"
          >
            {modoFiesta ? '🎉 off' : '🎉 on'}
          </button>
        </nav>
      </header>

      <main>
        {vista === 'grilla' && renderizarGrilla()}
        {vista === 'sorteo' && renderizarSorteo()}
      </main>
      
      {modoFiesta && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <style>
            {`
              @keyframes fiesta-confetti {
                0%, 100% { opacity: 0; }
                50% { opacity: 0.3; }
              }
              
              .confetti-piece {
                position: absolute;
                width: 10px;
                height: 20px;
                background: #ff0;
                opacity: 0;
                animation: fiesta-confetti 1.5s ease-in-out infinite;
              }
            `}
          </style>
          
          {/* Generar piezas de confetti estáticas */}
          {[...Array(50)].map((_, i) => {
            const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
            const size = Math.floor(Math.random() * 10) + 5;
            const left = Math.floor(Math.random() * 100);
            const top = Math.floor(Math.random() * 100);
            const delay = Math.random() * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div 
                key={i}
                className="confetti-piece"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  backgroundColor: color,
                  width: `${size}px`,
                  height: `${size * 2}px`,
                  animationDelay: `${delay}s`
                }}
              />
            );
          })}
        </div>
      )}
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} TotalRifa - Desarrollado con ♥ por <a href="https://maxdenuevo.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Max</a></p>
      </footer>
    </div>
  );
};

export default SorteoApp;
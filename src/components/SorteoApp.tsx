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
  nombre: string;
  posicion: number;
}

const SorteoApp: React.FC = () => {
  // Estados con tipado
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [ganadores, setGanadores] = useState<number[]>([]);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [sorteando, setSorteando] = useState<boolean>(false);
  const [vista, setVista] = useState<'grilla' | 'sorteo'>('grilla');
  const [etapaSorteo, setEtapaSorteo] = useState<number>(0); // 0: sin iniciar, 1-3: premios
  
  // Número de WhatsApp para contacto
  const numeroWhatsApp = "+56947366008";
  
  // premios disponibles
  const premios: Premio[] = [
    { nombre: "Cafetera", posicion: 1 },
    { nombre: "Sanguchera", posicion: 2 },
    { nombre: "Minipymer", posicion: 3 }
  ];

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

  // Función para generar todos los números de la rifa (1-200)
  const generarNumeros = (): NumeroRifa[] => {
    const numeros: NumeroRifa[] = [];
    
    // Generamos exactamente 200 números
    for (let i = 1; i <= 200; i++) {
      // Buscamos si este número está vendido en la lista de participantes
      const participante = participantes.find(p => Number(p.numero) === i);
      
      numeros.push({
        numero: i,
        vendido: !!participante, // Convertimos a booleano (true si existe participante, false si no)
        nombre: participante ? participante.nombre : '',
        telefono: participante ? participante.telefono : ''
      });
    }
    
    // Verificamos y hacemos un log de cuántos números vendidos hay
    const vendidos = numeros.filter(n => n.vendido).length;
    console.log(`Números vendidos: ${vendidos} de 200`);
    
    return numeros;
  };

  // Función para obtener enlace a WhatsApp
  const obtenerEnlaceWhatsApp = (numero: number): string => {
    const mensaje = encodeURIComponent(`Aiskely, quiero comprar el número ${numero} porfa`);
    return `https://wa.me/${numeroWhatsApp.replace(/\D/g, '')}?text=${mensaje}`;
  };

  // Función para lanzar confetti
  const lanzarConfetti = (): void => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
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

  // fn para iniciar el sorteo
  const iniciarSorteo = (): void => {
    // Reiniciamos todos los estados
    setGanadores([]);
    setNumeroActual(null);
    setEtapaSorteo(1); // Iniciamos en la etapa 1
    
    // Comenzamos el sorteo del primer premio
    iniciarSorteoPremio();
  };

  // Función para continuar al siguiente premio
  const continuarSorteo = (): void => {
    if (etapaSorteo < 3) {
      setEtapaSorteo(prevEtapa => prevEtapa + 1);
      iniciarSorteoPremio();
    }
  };

  // Función para iniciar el sorteo de un premio específico
  const iniciarSorteoPremio = (): void => {
    setSorteando(true);
    setNumeroActual(null);
    
    // Filtramos solo los números vendidos que no han ganado aún
    const numerosVendidos = generarNumeros()
      .filter(n => n.vendido && !ganadores.includes(n.numero));
    
    // Si no hay más números disponibles, terminamos
    if (numerosVendidos.length === 0) {
      setSorteando(false);
      return;
    }

    // Efecto de "ruleta" rápida
    let contador = 0;
    const intervalId = setInterval(() => {
      const indiceAleatorio = Math.floor(Math.random() * numerosVendidos.length);
      setNumeroActual(numerosVendidos[indiceAleatorio].numero);
      
      contador++;
      if (contador > 20) { // Después de 20 iteraciones, paramos
        clearInterval(intervalId);
        const numeroGanador = numerosVendidos[indiceAleatorio].numero;
        
        // Añadimos el ganador
        setGanadores(prevGanadores => [...prevGanadores, numeroGanador]);
        
        // Lanzar confetti al conseguir un ganador
        lanzarConfetti();
        
        // Terminamos la fase de sorteo
        setSorteando(false);
        
        // Si es el último premio, lanzamos confetti extra
        if (etapaSorteo === 3) {
          setTimeout(() => {
            lanzarConfetti();
            setTimeout(lanzarConfetti, 500);
            setTimeout(lanzarConfetti, 1000);
          }, 300);
        }
      }
    }, 100);
  };

  const renderizarGrilla = (): JSX.Element => {
    const numeros = generarNumeros();
    
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
                    ${ganadores.includes(num.numero) ? 'ring-2 ring-yellow-400' : ''}
                    flex flex-col items-center justify-center
                  `}
                  title={`${num.numero}: ${num.nombre} (${num.telefono})`}
                >
                  <div className="font-bold">{num.numero}</div>
                  {num.vendido && (
                    <div className="text-xs">{obtenerIniciales(num.nombre)}</div>
                  )}
                  {ganadores.includes(num.numero) && (
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
    // Calculamos en qué etapa estamos
    const premioActual = etapaSorteo > 0 ? premios[etapaSorteo - 1] : null;
    
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Rifa en Vivo</h2>
        
        {/* Mostrar el estado del sorteo */}
        <div className="mb-4">
          {etapaSorteo === 0 ? (
            <div className="text-lg">Presiona "Iniciar Rifa" para comenzar</div>
          ) : (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 inline-block">
              <div className="font-bold text-lg">
                {sorteando ? 'Sorteando...' : `Premio #${etapaSorteo}`}
              </div>
              {premioActual && (
                <div className="text-md">{premioActual.nombre}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Número actual en el sorteo */}
        <div className="mb-6">
          <div className={`text-6xl font-bold m-8 p-8 bg-yellow-100 rounded-lg inline-block min-w-60 transition-all ${sorteando ? 'animate-pulse' : ''}`}>
            {numeroActual || '?'}
          </div>
        </div>
        
        {/* Mostrar ganadores */}
        {ganadores.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Ganadores</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {ganadores.map((numero, index) => {
                const ganador = participantes.find(p => Number(p.numero) === numero);
                return (
                  <div key={index} className="bg-green-100 p-4 rounded-lg shadow-md">
                    <div className="bg-yellow-200 text-yellow-800 mb-2 py-1 px-3 rounded-full text-sm font-bold inline-block">
                      {premios[index]?.nombre || `Premio #${index + 1}`}
                    </div>
                    <div className="font-bold text-2xl">{numero}</div>
                    <div className="font-medium">{ganador?.nombre}</div>
                    <div className="text-sm text-gray-600">{ganador?.telefono}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-center flex-wrap gap-4">
          {etapaSorteo === 0 ? (
            // Botón para iniciar el sorteo
            <button
              onClick={iniciarSorteo}
              className="p-4 rounded-lg text-white font-bold text-xl bg-blue-500 hover:bg-blue-600 shadow-md transition-colors"
            >
              Iniciar Rifa
            </button>
          ) : (
            <>
              {/* Si estamos esperando para continuar al siguiente premio */}
              {!sorteando && etapaSorteo < 3 && ganadores.length === etapaSorteo && (
                <button
                  onClick={continuarSorteo}
                  className="p-4 rounded-lg text-white font-bold text-xl bg-green-500 hover:bg-green-600 shadow-md transition-colors"
                >
                  Sortear Siguiente Premio
                </button>
              )}
              
              {/* Mostrar botón para reiniciar si ya terminamos o quieren reiniciar */}
              {(!sorteando && (etapaSorteo === 3 || ganadores.length === 3)) && (
                <button
                  onClick={() => {
                    setEtapaSorteo(0);
                    setGanadores([]);
                    setNumeroActual(null);
                  }}
                  className="p-4 rounded-lg text-white font-bold text-xl bg-blue-500 hover:bg-blue-600 shadow-md transition-colors"
                >
                  Reiniciar Rifa
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Mensaje informativo sobre el estado del sorteo */}
        <div className="mt-6 text-gray-600">
          {etapaSorteo === 0 ? (
            <p>Vamos a rifar 3 premios entre los números vendidos</p>
          ) : ganadores.length === 3 ? (
            <p className="font-medium">¡Rifa completada! Todos los premios fueron sorteados.</p>
          ) : (
            <p>
              {sorteando ? 
                `Sorteando premio #${etapaSorteo}...` : 
                `Premios sorteados: ${ganadores.length}/3`}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Calcular estadísticas sobre los números vendidos
  const numerosVendidos = generarNumeros().filter(n => n.vendido).length;

  return (
    <div className="max-w-4xl mx-auto p-4">
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
        
        <div className="flex justify-center mt-4 gap-2 flex-wrap mb-4">
          {premios.map((premio, idx) => (
            <div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center shadow-sm">
              <div className="font-bold">{premio.nombre}</div>
              <div className="text-xs text-gray-600">Premio #{premio.posicion}</div>
            </div>
          ))}
        </div>
        
        <nav className="flex justify-center mt-4 gap-2">
          <button 
            onClick={() => setVista('grilla')}
            className={`px-4 py-2 rounded ${vista === 'grilla' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-200'}`}
          >
            Números
          </button>
          <button 
            onClick={() => setVista('sorteo')}
            className={`px-4 py-2 rounded ${vista === 'sorteo' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-200'}`}
          >
            Realizar Rifa
          </button>
        </nav>
      </header>

      <main>
        {vista === 'grilla' && renderizarGrilla()}
        {vista === 'sorteo' && renderizarSorteo()}
      </main>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} TotalRifa - Desarrollado con ♥ por <a href="https://maxdenuevo.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Max</a></p>
      </footer>
    </div>
  );
};

export default SorteoApp;
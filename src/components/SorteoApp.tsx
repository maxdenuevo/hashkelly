import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';

// Definición de interfaces
interface Participante {
  numero: number;
  nombre: string;
  telefono: string;
  [key: string]: any; // Para campos adicionales que puedan existir en el CSV
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

// Componente principal de la aplicación
const SorteoApp: React.FC = () => {
  // Estados con tipado correcto
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [ganadores, setGanadores] = useState<number[]>([]);
  const [numeroActual, setNumeroActual] = useState<number | null>(null);
  const [sorteando, setSorteando] = useState<boolean>(false);
  const [vista, setVista] = useState<'grilla' | 'sorteo'>('grilla');
  
  // Lista de premios disponibles
  const premios: Premio[] = [
    { nombre: "Cafetera", posicion: 1 },
    { nombre: "Sanguchera", posicion: 2 },
    { nombre: "Miniprocesadora", posicion: 3 }
  ];

  // Efecto para cargar los datos del CSV (desde el repositorio)
  useEffect(() => {
    // Función para cargar el CSV desde la carpeta /public del proyecto
    async function cargarCSV(): Promise<void> {
      try {
        // En producción, el archivo estará en la carpeta public
        const response = await fetch('/participantes.csv');
        const texto = await response.text();
        
        // Parseamos el CSV
        Papa.parse<Participante>(texto, {
          header: true,
          dynamicTyping: true, // Convertir números automáticamente
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
        // Fallback con datos de ejemplo para desarrollo
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

  // Función para lanzar confetti
  const lanzarConfetti = (): void => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Función para obtener las iniciales de un nombre
  const obtenerIniciales = (nombre: string): string => {
    if (!nombre) return '';
    return nombre
      .split(' ')
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Función para iniciar el sorteo
  const iniciarSorteo = (): void => {
    setSorteando(true);
    setGanadores([]); // Reiniciar ganadores
    setNumeroActual(null); // Reiniciar número actual
    
    // Pequeño retraso para asegurar que el estado se ha actualizado
    setTimeout(() => {
      sortearNumero();
    }, 100);
  };

  // Función para sortear un número
  const sortearNumero = (): void => {
    // IMPORTANTE: Verificar primero si ya tenemos 3 ganadores (todos los premios sorteados)
    if (ganadores.length >= 3) {
      setSorteando(false);
      return;
    }
    
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
        
        // Verificamos explícitamente si añadir este ganador superaría el límite de 3
        if (ganadores.length >= 3) {
          return; // No hacemos nada si ya hay 3 ganadores
        }
        
        // Usamos una función de callback para tener el valor actualizado de ganadores
        setGanadores(prevGanadores => {
          // Verificación adicional de seguridad
          if (prevGanadores.length >= 3) {
            return prevGanadores; // No añadimos más ganadores si ya hay 3
          }
          
          const nuevosGanadores = [...prevGanadores, numeroGanador];
          
          // Lanzar confetti al conseguir un ganador
          lanzarConfetti();
          
          // Verificamos si con este nuevo ganador llegamos a 3
          if (nuevosGanadores.length >= 3) {
            // Si con este ganador llegamos a 3, detenemos el sorteo y lanzamos confetti extra
            setSorteando(false);
            // Confetti extra al completar todos los premios
            setTimeout(() => {
              lanzarConfetti();
              setTimeout(lanzarConfetti, 500);
              setTimeout(lanzarConfetti, 1000);
            }, 300);
          } else {
            // Si aún no llegamos a 3, continuamos con el siguiente sorteo
            setTimeout(sortearNumero, 2000);
          }
          
          return nuevosGanadores;
        });
      }
    }, 100);
  };

  // Renderizado de la grilla de números
  const renderizarGrilla = (): JSX.Element => {
    const numeros = generarNumeros();
    
    // Aseguramos que se muestren exactamente 200 números
    const totalNumeros = 200;
    
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Números de Rifa</h2>
        
        {/* Estadísticas de la rifa */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Números vendidos: {numeros.filter(n => n.vendido).length} de {totalNumeros}
          </p>
        </div>
        
        {/* Contenedor para la grilla */}
        <div className="w-full overflow-hidden">
          {/* Grid con filas y columnas explícitas para mayor compatibilidad */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
            }}
            className="grid-numeros mb-4"
          >
            {numeros.slice(0, totalNumeros).map(num => (
              <div 
                key={num.numero}
                className={`
                  p-2 rounded-lg text-center cursor-pointer relative transition-all
                  ${num.vendido ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}
                  ${ganadores.includes(num.numero) ? 'ring-2 ring-yellow-400' : ''}
                `}
                title={num.vendido ? `${num.numero}: ${num.nombre} (${num.telefono})` : `Número ${num.numero} - Disponible`}
              >
                <div className="font-bold">{num.numero}</div>
                {num.vendido && (
                  <div className="text-xs">{obtenerIniciales(num.nombre)}</div>
                )}
                {ganadores.includes(num.numero) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full" title="¡Ganador!"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Estilos responsivos adicionales usando media queries */}
        <style jsx>{`
          @media (min-width: 640px) {
            .grid-numeros {
              grid-template-columns: repeat(8, 1fr);
            }
          }
          @media (min-width: 768px) {
            .grid-numeros {
              grid-template-columns: repeat(10, 1fr);
            }
          }
        `}</style>
        
        {/* Leyenda */}
        <div className="mt-4 flex justify-center gap-4 text-sm">
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
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Rifa en Vivo</h2>
        
        <div className="mb-6">
          <div className="text-6xl font-bold m-8 p-8 bg-yellow-100 rounded-lg inline-block min-w-60">
            {numeroActual || '?'}
          </div>
        </div>
        
        {ganadores.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Ganadores</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {ganadores.map((numero, index) => {
                const ganador = participantes.find(p => Number(p.numero) === numero);
                return (
                  <div key={index} className="bg-green-100 p-4 rounded-lg">
                    <div className="bg-yellow-200 text-yellow-800 mb-2 py-1 px-2 rounded-full text-sm font-bold inline-block">
                      {premios[index]?.nombre || `Premio #${index + 1}`}
                    </div>
                    <div className="font-bold text-xl">{numero}</div>
                    <div>{ganador?.nombre}</div>
                    <div className="text-sm">{ganador?.telefono}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <button
          onClick={iniciarSorteo}
          disabled={sorteando}
          className={`
            p-4 rounded-lg text-white font-bold text-xl
            ${sorteando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
          `}
        >
          {sorteando ? 'Sorteando...' : ganadores.length > 0 ? 'Reiniciar Sorteo' : 'Iniciar Sorteo'}
        </button>
        
        {/* Mensaje informativo sobre el estado del sorteo */}
        <div className="mt-4 text-gray-600">
          {ganadores.length === 3 ? (
            <p className="font-medium">Rifa completa. ¡Todos los premios fueron rifados!</p>
          ) : ganadores.length > 0 ? (
            <p>Premios sorteados: {ganadores.length}/3</p>
          ) : (
            <p>Vamos a sortear 3 premios entre los {numerosVendidos} números vendidos</p>
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
        <h1 className="text-3xl font-bold text-center text-blue-600">Hashkelly - Sorteo Benéfico</h1>
        <p className="text-center text-gray-600">
          ¡{numerosVendidos} números vendidos de 200! - 3 super premios a sortear
        </p>
        
        {/* Mostrar premios en la parte superior */}
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
            Grilla de Números
          </button>
          <button 
            onClick={() => setVista('sorteo')}
            className={`px-4 py-2 rounded ${vista === 'sorteo' ? 'bg-blue-500 text-white font-bold' : 'bg-gray-200'}`}
          >
            Realizar Sorteo
          </button>
        </nav>
      </header>

      <main>
        {vista === 'grilla' && renderizarGrilla()}
        {vista === 'sorteo' && renderizarSorteo()}
      </main>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Rifa - Desarrollado con ♥ por Max</p>
      </footer>
    </div>
  );
};

export default SorteoApp;
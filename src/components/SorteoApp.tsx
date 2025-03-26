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
    { nombre: "Miniprocesadora (Minipymer)", posicion: 3 }
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
          error: (error) => {
            console.error('Error al parsear CSV:', error);
          }
        });
      } catch (error) {
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
    for (let i = 1; i <= 200; i++) {
      // Buscamos si este número está vendido
      const participante = participantes.find(p => Number(p.numero) === i);
      numeros.push({
        numero: i,
        vendido: !!participante,
        nombre: participante ? participante.nombre : '',
        telefono: participante ? participante.telefono : ''
      });
    }
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
    // Verificar si ya tenemos 3 ganadores (todos los premios sorteados)
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
        
        // Usamos una función de callback para tener el valor actualizado de ganadores
        setGanadores(prevGanadores => {
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
    
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Números de Rifa</h2>
        <div className="grid grid-cols-10 gap-2">
          {numeros.map(num => (
            <div 
              key={num.numero}
              className={`
                p-2 rounded-lg text-center cursor-pointer relative 
                ${num.vendido ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}
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
    );
  };

  // Renderizado de la vista de sorteo
  const renderizarSorteo = (): JSX.Element => {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Sorteo en Vivo</h2>
        
        <div className="mb-6">
          <div className="text-6xl font-bold m-8 p-8 bg-yellow-100 rounded-lg inline-block min-w-60">
            {numeroActual || '?'}
          </div>
        </div>
        
        {ganadores.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Ganadores</h3>
            <div className="flex justify-center gap-4">
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
            <p className="font-medium">Sorteo completado. ¡Todos los premios han sido sorteados!</p>
          ) : ganadores.length > 0 ? (
            <p>Premios sorteados: {ganadores.length}/3</p>
          ) : (
            <p>Se sortearán 3 premios entre los 150 números vendidos</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center text-blue-600">Hashkelly - Sorteo Benéfico</h1>
        <p className="text-center text-gray-600">¡150 números vendidos de 200! - 3 premios: Cafetera, Sanguchera y Miniprocesadora</p>
        
        {/* Mostrar premios en la parte superior */}
        <div className="flex justify-center mt-4 gap-4 mb-4">
          {premios.map((premio, idx) => (
            <div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
              <div className="font-bold">{premio.nombre}</div>
              <div className="text-sm text-gray-600">Premio #{premio.posicion}</div>
            </div>
          ))}
        </div>
        
        <nav className="flex justify-center mt-4 gap-2">
          <button 
            onClick={() => setVista('grilla')}
            className={`px-4 py-2 rounded ${vista === 'grilla' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Grilla de Números
          </button>
          <button 
            onClick={() => setVista('sorteo')}
            className={`px-4 py-2 rounded ${vista === 'sorteo' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Realizar Sorteo
          </button>
        </nav>
      </header>

      <main>
        {vista === 'grilla' && renderizarGrilla()}
        {vista === 'sorteo' && renderizarSorteo()}
      </main>
    </div>
  );
};

export default SorteoApp;
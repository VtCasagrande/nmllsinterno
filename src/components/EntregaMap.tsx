'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Entrega } from '@/types/entregas';
import dynamic from 'next/dynamic';
import { formatAddressForNavigation } from '@/utils/address';

// Ajuste para o ícone do Leaflet
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Definição do ícone personalizado para o motorista
const motoristIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface EnderecoCoord {
  endereco: string;
  lat: number;
  lng: number;
}

interface MotoristaInfo {
  nome: string;
  veiculo: string;
  placa: string;
  lat?: number;
  lng?: number;
}

interface EntregaMapProps {
  enderecos: string[] | Array<{
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade: string;
    cep: string;
    endereco?: string;
  }>;
  motorista?: MotoristaInfo;
  height?: string;
  width?: string;
  zoom?: number;
}

// Componentes do Leaflet importados dinamicamente para evitar erros durante o SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

function EntregaMap({ 
  enderecos, 
  motorista, 
  height = '400px', 
  width = '100%',
  zoom = 13 
}: EntregaMapProps) {
  const [coordenadas, setCoordenadas] = useState<EnderecoCoord[]>([]);
  const [mapaCarregado, setMapaCarregado] = useState(false);
  const [centroDaMapa, setCentroDaMapa] = useState<[number, number]>([-23.550520, -46.633308]); // São Paulo por padrão
  
  // Função para geocodificar endereços
  const geocodificarEnderecos = async () => {
    try {
      const promessas = enderecos.map(async (endereco) => {
        // Formatar o endereço para navegação
        let enderecoFormatado: string;
        
        if (typeof endereco === 'string') {
          // Endereço já está em formato de string (compatibilidade)
          enderecoFormatado = endereco;
        } else {
          // Novo formato de endereço com campos separados
          enderecoFormatado = formatAddressForNavigation(endereco);
        }
        
        // Simulação de geocodificação (em uma aplicação real, usaríamos uma API)
        // Aqui estamos gerando coordenadas aleatórias próximas ao centro de São Paulo
        const variacaoLat = (Math.random() - 0.5) * 0.05;
        const variacaoLng = (Math.random() - 0.5) * 0.05;
        
        return {
          endereco: enderecoFormatado,
          lat: -23.550520 + variacaoLat,
          lng: -46.633308 + variacaoLng
        };
      });
      
      const resultados = await Promise.all(promessas);
      setCoordenadas(resultados);
      
      // Define o centro do mapa como a média das coordenadas
      if (resultados.length > 0) {
        const mediaLat = resultados.reduce((acc, curr) => acc + curr.lat, 0) / resultados.length;
        const mediaLng = resultados.reduce((acc, curr) => acc + curr.lng, 0) / resultados.length;
        setCentroDaMapa([mediaLat, mediaLng]);
      }
      
      setMapaCarregado(true);
    } catch (error) {
      console.error('Erro ao geocodificar endereços:', error);
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixLeafletIcon();
      geocodificarEnderecos();
    }
  }, [enderecos]);
  
  if (!mapaCarregado || typeof window === 'undefined') {
    return (
      <div 
        style={{ 
          height, 
          width, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f0f0f0',
          borderRadius: '0.375rem'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Carregando mapa...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ height, width }}>
      <MapContainer
        center={centroDaMapa}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcadores para os endereços */}
        {coordenadas.map((coord, index) => (
          <Marker key={index} position={[coord.lat, coord.lng]}>
            <Popup>
              <div>
                <p className="font-medium">Entrega:</p>
                <p className="text-sm">{coord.endereco}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Marcador para o motorista */}
        {motorista && motorista.lat && motorista.lng && (
          <Marker 
            position={[motorista.lat, motorista.lng]} 
            icon={motoristIcon}
          >
            <Popup>
              <div>
                <p className="font-medium">Motorista:</p>
                <p className="text-sm">{motorista.nome}</p>
                <p className="text-sm">{motorista.veiculo} - {motorista.placa}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Exportar como um componente do lado do cliente para garantir que não seja renderizado no servidor
export default dynamic(() => Promise.resolve(EntregaMap), {
  ssr: false
}); 
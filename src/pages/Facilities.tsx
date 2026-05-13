import { useState, useEffect, useMemo } from 'react';
import { Hospital, Phone, MapPin, Plus, Trash2, X, Search, Building2, ExternalLink, ArrowLeft, Navigation, Map as MapIcon, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Facility, User } from '../types';
import { INITIAL_FACILITIES } from '../data/mockData';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const UserIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-[ping_3s_infinite]"></div>
      <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-[pulse_2s_infinite]"></div>
      <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)] z-10 relative flex items-center justify-center">
        <div class="w-1 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

const IncidentIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="absolute -inset-4 bg-red-600/30 rounded-full animate-ping"></div>
      <div class="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transform -translate-y-2">
        <span class="text-white text-lg font-black italic">!</span>
      </div>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const RecommendationIcon = (type: string) => L.divIcon({
  html: `
    <div class="relative flex flex-col items-center">
      <div class="absolute -inset-4 bg-red-600/20 rounded-full animate-ping"></div>
      <div class="absolute -top-10 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-2xl uppercase italic whitespace-nowrap z-[2000] border-2 border-white">
        ${type === 'RS' ? 'REKOMENDASI: RS' : 'REKOMENDASI: KLINIK'}
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-600 rotate-45 border-b-2 border-r-2 border-white"></div>
      </div>
      <div class="w-10 h-10 bg-white rounded-full border-4 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center scale-110 z-[1100]">
         <div class="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
         <div class="absolute inset-0 border-2 border-red-200 rounded-full animate-[ping_3s_infinite]"></div>
      </div>
      <div class="w-2 h-4 bg-red-600/40 rounded-full mt-1 blur-[1px]"></div>
    </div>
  `,
  className: '',
  iconSize: [40, 60],
  iconAnchor: [20, 60]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map center
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
}

function LocateControl({ setUserLocation, setIncidentLocation }: { setUserLocation: (loc: [number, number]) => void, setIncidentLocation: (loc: [number, number]) => void }) {
  const map = useMap();
  
  const locate = () => {
    map.locate({ setView: true, maxZoom: 16 }).on("locationfound", function (e) {
      const loc: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserLocation(loc);
      setIncidentLocation(loc);
      // Force a manual flyTo to be sure
      map.flyTo(e.latlng, 16, { animate: true, duration: 1.5 });
    });
  };

  return (
    <div className="leaflet-top leaflet-right mt-12 mr-3 font-sans space-y-2">
      <button 
        onClick={(e) => {
          e.preventDefault();
          locate();
        }}
        className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-xl hover:bg-slate-50 transition-all text-blue-600 group"
        title="Gunakan Lokasi GPS"
      >
        <Navigation className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="text-[8px] font-black uppercase mt-0.5">GPS</span>
      </button>
      <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-lg text-[10px] font-bold text-slate-600 max-w-[120px] leading-tight italic">
        💡 Klik di peta untuk menandai titik kejadian kecelakaan
      </div>
    </div>
  );
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface FacilitiesProps {
  user: User;
}

export default function Facilities({ user }: FacilitiesProps) {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(() => {
    const saved = localStorage.getItem('aksi_cepat_incident_location');
    return saved ? JSON.parse(saved) : null;
  });

  const updateIncidentLocation = (loc: [number, number]) => {
    setIncidentLocation(loc);
    localStorage.setItem('aksi_cepat_incident_location', JSON.stringify(loc));
  };
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    type: 'RS' as 'RS' | 'Klinik',
    lat: -6.2000,
    lng: 106.8166
  });

  const [isFetchingNearby, setIsFetchingNearby] = useState(false);

  const fetchNearbyFromOSM = async (lat: number, lng: number, radius = 15000) => {
    setIsFetchingNearby(radius <= 15000); // Only show overlay for first fetch
    try {
      console.log(`Fetching OSM nearby (radius: ${radius}m) for:`, lat, lng);
      // Overpass API Query for hospitals and clinics
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});
          way["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});
          relation["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});
        );
        out center;
      `;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("OSM Fetch Failed");
      const data = await response.json();
      
      const osmFacilities: Facility[] = data.elements.map((el: any) => {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || (tags.amenity === 'hospital' ? 'Rumah Sakit Umum' : 'Klinik Umum');
        const address = tags['addr:full'] || tags['addr:street'] || tags['addr:city'] || 'Alamat Terdeteksi Sistem';
        const phone = tags['contact:phone'] || tags.phone || tags['emergency:phone'] || '119 (Darurat)';
        const type = tags.amenity === 'hospital' ? 'RS' : 'Klinik';
        
        return {
          id: `osm-${el.id}`,
          name,
          address,
          phone,
          type,
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon
        } as Facility;
      }).filter((f: Facility) => f.lat && f.lng);
 
      console.log(`Found ${osmFacilities.length} OSM results.`);

      if (osmFacilities.length === 0 && radius < 45000) {
        // Retry with larger radius if nothing found
        console.log("No results, retrying with 45km...");
        fetchNearbyFromOSM(lat, lng, 45000);
        return;
      }
 
      setFacilities(prev => {
        const nonOSM = prev.filter(f => !f.id.startsWith('osm-'));
        const filteredOSM = osmFacilities.filter(of => !nonOSM.some(pf => pf.name.toLowerCase() === of.name.toLowerCase()));
        console.log(`Merging ${filteredOSM.length} new OSM facilities.`);
        return [...nonOSM, ...filteredOSM];
      });
    } catch (error) {
      console.error("OSM Error:", error);
    } finally {
      setIsFetchingNearby(false);
    }
  };

  useEffect(() => {
    const targetLoc = incidentLocation || userLocation;
    if (targetLoc) {
      fetchNearbyFromOSM(targetLoc[0], targetLoc[1]);
    }
  }, [incidentLocation?.[0], incidentLocation?.[1], userLocation?.[0], userLocation?.[1]]);

  useEffect(() => {
    // Initialize facilities
    const saved = localStorage.getItem('aksi_cepat_facilities');
    if (saved) {
      const parsed: Facility[] = JSON.parse(saved);
      // If we have fewer than 15 facilities, reset to include the new ones
      const needsUpdate = parsed.length < 15 || parsed.some(f => !f.lat || !f.lng);
      if (needsUpdate) {
        setFacilities(INITIAL_FACILITIES);
        localStorage.setItem('aksi_cepat_facilities', JSON.stringify(INITIAL_FACILITIES));
      } else {
        setFacilities(parsed);
      }
    } else {
      setFacilities(INITIAL_FACILITIES);
      localStorage.setItem('aksi_cepat_facilities', JSON.stringify(INITIAL_FACILITIES));
    }

    // Watch user location for real-time tracking (like Gojek)
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          localStorage.setItem('aksi_cepat_user_location', JSON.stringify(loc));
          // Always keep incident location synced for "Automatic" behavior if not explicitly set
          if (!localStorage.getItem('aksi_cepat_incident_location')) {
            setIncidentLocation(loc); 
          }
        },
        (error) => console.error("Error watching location:", error),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const recommendedFacilities = useMemo(() => {
    const baseLoc = incidentLocation || userLocation;
    if (!baseLoc || facilities.length === 0) return [];
    
    return [...facilities]
      .map(f => ({
        ...f,
        distance: f.lat && f.lng ? calculateDistance(baseLoc[0], baseLoc[1], f.lat, f.lng) : Infinity
      }))
      .filter(f => f.distance !== Infinity && f.distance < 50) // Within 50km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15); // Show top 15 recommendations on map
  }, [userLocation, incidentLocation, facilities]);

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newFacility: Facility = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      lat: Number(formData.lat),
      lng: Number(formData.lng)
    };
    const newFacilities = [...facilities, newFacility];
    setFacilities(newFacilities);
    localStorage.setItem('aksi_cepat_facilities', JSON.stringify(newFacilities));
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus data fasilitas kesehatan ini?')) {
      const newFacilities = facilities.filter(f => f.id !== id);
      setFacilities(newFacilities);
      localStorage.setItem('aksi_cepat_facilities', JSON.stringify(newFacilities));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', address: '', phone: '', type: 'RS', lat: -6.2000, lng: 106.8166 });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-800">Faskes Terdekat</h1>
          <p className="text-slate-500">Daftar Rumah Sakit dan Klinik untuk penanganan medis profesional.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm",
                viewMode === 'list' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <List className="w-4 h-4" /> Daftar
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-sm",
                viewMode === 'map' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <MapIcon className="w-4 h-4" /> Peta
            </button>
          </div>
          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 shrink-0"
            >
              <Plus className="w-5 h-5" />
              Tambah Faskes
            </button>
          )}
        </div>
      </header>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="h-[600px] w-full rounded-[40px] overflow-hidden border border-slate-200 shadow-xl relative z-10 mb-8">
          <AnimatePresence>
            {isFetchingNearby && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
              >
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] italic">Mencari Faskes Terdekat...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MapContainer 
            center={userLocation || [-6.2088, 106.8456]} 
            zoom={13} 
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {incidentLocation && <ChangeView center={incidentLocation} zoom={16} />}
            <LocateControl setUserLocation={setUserLocation} setIncidentLocation={updateIncidentLocation} />
            <MapEvents onMapClick={(lat, lng) => updateIncidentLocation([lat, lng])} />
            
            {/* User GPS Marker (Passive) */}
            {userLocation && (
              <Marker position={userLocation} icon={UserIcon} zIndexOffset={-500} />
            )}

            {/* Auto-detected Incident / Crash Marker */}
            {incidentLocation && (
              <Marker position={incidentLocation} icon={IncidentIcon}>
                <Tooltip permanent direction="bottom" offset={[0, 10]} className="!bg-red-600 !border-none !text-white !font-black !px-3 !py-2 !rounded-xl !shadow-2xl !italic">
                  <div className="flex flex-col items-center">
                    <span>LOKASI KEJADIAN TERDETEKSI</span>
                    {isFetchingNearby ? (
                      <span className="text-[7px] animate-pulse mt-0.5 opacity-80 uppercase tracking-widest leading-none">Mencari RS Terdekat...</span>
                    ) : (
                      <span className="text-[7px] mt-0.5 opacity-80 uppercase tracking-widest leading-none">Disarankan: {recommendedFacilities.length} Faskes di Area</span>
                    )}
                  </div>
                </Tooltip>
                <Popup>Titik lokasi kecelakaan (Terbaca Otomatis)</Popup>
              </Marker>
            )}

            {/* Facility Markers */}
            {facilities.map((f) => {
              const isRecommended = recommendedFacilities.some(rf => rf.id === f.id);
              return f.lat && f.lng && (
                <Marker 
                  key={f.id} 
                  position={[f.lat, f.lng]} 
                  icon={isRecommended ? RecommendationIcon(f.type) : DefaultIcon}
                  zIndexOffset={isRecommended ? 2000 : 0}
                >
                  <Tooltip 
                    permanent={isRecommended}
                    direction="top" 
                    offset={[0, -45]} 
                    className={cn(
                      "!bg-slate-900 !border-none !shadow-2xl !p-0 !rounded-lg overflow-hidden min-w-[120px]",
                      !isRecommended && "opacity-0 hover:opacity-100 transition-opacity"
                    )}
                  >
                    <div className="flex flex-col">
                       <div className={cn(
                         "px-2 py-0.5 border-b flex items-center gap-1.5",
                         isRecommended ? "bg-red-600 border-red-500" : "bg-slate-800 border-slate-700"
                       )}>
                         <Hospital className="w-2.5 h-2.5 text-white" />
                         <span className="font-black text-[9px] text-white uppercase tracking-wider italic truncate">
                           {f.name.toUpperCase()}
                         </span>
                       </div>
                       <div className="bg-white px-3 py-1.5 flex flex-col space-y-0.5">
                         <span className="text-[10px] font-bold text-slate-800 line-clamp-1 italic underline decoration-blue-100 uppercase leading-none">{f.address}</span>
                         <div className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-red-600" />
                            <span className="text-[9px] font-black text-red-600 italic tracking-tighter">{f.phone}</span>
                         </div>
                       </div>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 space-y-3 min-w-[200px]">
                       <div className="border-b border-slate-100 pb-2">
                          <h4 className="font-black text-base text-slate-900 leading-tight italic">{f.name}</h4>
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter italic">Layanan Darurat 24 Jam</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed m-0 italic">
                             <span className="font-bold text-slate-900 block not-italic">ALAMAT:</span>
                             {f.address}
                          </p>
                       </div>
                       <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                          <span className="text-[9px] font-black text-red-600 uppercase block mb-1">Hubungi Darurat:</span>
                          <p className="text-sm font-black text-red-700 m-0 font-mono tracking-wider">{f.phone}</p>
                       </div>
                       <a 
                         href={`tel:${f.phone}`} 
                         className="block w-full py-2.5 bg-red-600 text-white rounded-xl text-center text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
                       >
                         Telepon Sekarang
                       </a>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      )}

      {/* Recommended Closest Facilities & Table Section */}
      {viewMode === 'map' && recommendedFacilities.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-red-600 animate-pulse" />
                <h3 className="font-black text-slate-900 italic uppercase tracking-tighter text-xl">Rekomendasi Terdekat</h3>
             </div>
             <p className="text-[10px] font-bold text-slate-400 italic">Diurutkan berdasarkan jarak terdekat</p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
            {recommendedFacilities.map((f, idx) => (
              <motion.div 
                key={f.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="min-w-[320px] p-5 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-100/50 flex flex-col gap-4 relative overflow-hidden"
              >
                {idx === 0 && (
                  <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white text-[9px] font-black uppercase rounded-bl-xl italic">Terdekat!</div>
                )}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    idx === 0 ? "bg-red-600 shadow-red-100" : "bg-slate-900 shadow-slate-100"
                  )}>
                    <Hospital className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 leading-none mb-1 italic truncate">{f.name}</h4>
                    <p className="text-[10px] font-bold text-red-600 italic">~{f.distance.toFixed(2)} km dari area kejadian</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-1 italic">{f.address}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <a 
                    href={`tel:${f.phone}`}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase text-center hover:bg-red-100 transition-colors"
                  >
                    Hubungi
                  </a>
                  <button 
                    onClick={() => {
                      let url = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`;
                      if (incidentLocation) {
                        url += `&origin=${incidentLocation[0]},${incidentLocation[1]}`;
                      } else {
                        url += `&origin=Current+Location`;
                      }
                      window.open(url, '_blank');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase text-center hover:bg-slate-800 transition-colors"
                  >
                    Navigasi
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* New Table Section */}
          <div className="mt-8 bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-xl text-slate-900 italic uppercase">RS & Klinik Terdekat</h3>
                  {isFetchingNearby && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <span className="text-[10px] font-black text-blue-600 uppercase italic">Mencari Faskes...</span>
                    </div>
                  )}
                </div>
                <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">Data Real-time</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50">
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fasilitas Kesehatan</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jarak</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {recommendedFacilities.map((f, i) => (
                         <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    f.type === 'RS' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                  )}>
                                     {f.type === 'RS' ? <Hospital className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-900 text-sm leading-none m-0">{f.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter italic">{f.type === 'RS' ? 'Rumah Sakit' : 'Klinik'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg italic">
                                  {f.distance.toFixed(2)} KM
                               </span>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-xs text-slate-500 line-clamp-1 italic max-w-[250px] uppercase leading-relaxed">{f.address}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <a href={`tel:${f.phone}`} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                                     <Phone className="w-4 h-4" />
                                  </a>
                                  <button 
                                    onClick={() => {
                                      let url = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`;
                                      if (incidentLocation) {
                                        url += `&origin=${incidentLocation[0]},${incidentLocation[1]}`;
                                      } else {
                                        url += `&origin=Current+Location`;
                                      }
                                      window.open(url, '_blank');
                                    }}
                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                                  >
                                     <ExternalLink className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {viewMode === 'list' && (
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari lokasi RS atau Klinik..."
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] shadow-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-lg font-medium"
          />
        </div>
      )}

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((f) => (
          <motion.div 
            key={f.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[38px] border border-slate-200 shadow-sm flex flex-col gap-6 group hover:border-red-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                f.type === 'RS' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
              )}>
                {f.type === 'RS' ? <Hospital className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
              </div>
              {user.role === 'ADMIN' && (
                <button onClick={() => handleDelete(f.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
               <div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tighter leading-none italic">{f.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] mt-2 uppercase italic">{f.type === 'RS' ? 'Medical Center' : 'Outpatient Clinic'}</p>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed italic">{f.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-base font-bold text-slate-800">{f.phone}</p>
                  </div>
               </div>
            </div>

            <a 
              href={`tel:${f.phone}`}
              className="mt-2 w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-red-600 group-hover:text-white transition-all text-sm"
            >
              <Phone className="w-4 h-4" /> Hubungi Sekarang
            </a>
          </motion.div>
        ))}
      </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={closeModal}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl z-[70] overflow-hidden"
            >
              <div className="p-8 border-bottom border-slate-50 flex items-center justify-between bg-slate-50/30">
                 <h2 className="text-2xl font-bold text-slate-900">Tambah Faskes</h2>
                 <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-5">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Faskes</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="RS Pondok Indah"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-red-500 transition-all font-medium"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tipe</label>
                    <div className="flex gap-4">
                       <button 
                         type="button" 
                         onClick={() => setFormData(p => ({ ...p, type: 'RS' }))}
                         className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition-all", formData.type === 'RS' ? "border-red-600 bg-red-50 text-red-600" : "border-slate-100 text-slate-400")}
                       > Rumah Sakit </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData(p => ({ ...p, type: 'Klinik' as const }))}
                          className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition-all", formData.type === 'Klinik' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400")}
                        > Klinik </button>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                      placeholder="Masukkan alamat lengkap"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-red-500 transition-all font-medium resize-none text-sm"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon</label>
                    <input 
                      required
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="021-xxxx-xxxx"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-red-500 transition-all font-medium font-mono"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-red-600">Latitude (Peta)</label>
                       <input 
                         required
                         type="number" 
                         step="any"
                         value={formData.lat}
                         onChange={(e) => setFormData(p => ({ ...p, lat: Number(e.target.value) }))}
                         className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl outline-none focus:bg-white focus:border-red-500 transition-all font-mono text-sm"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 text-red-600">Longitude (Peta)</label>
                       <input 
                         required
                         type="number" 
                         step="any"
                         value={formData.lng}
                         onChange={(e) => setFormData(p => ({ ...p, lng: Number(e.target.value) }))}
                         className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl outline-none focus:bg-white focus:border-red-500 transition-all font-mono text-sm"
                       />
                    </div>
                 </div>

                 <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold mt-4 shadow-xl shadow-slate-200">
                    Simpan Data Faskes
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

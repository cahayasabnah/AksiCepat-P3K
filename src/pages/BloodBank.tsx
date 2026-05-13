import { useState, useEffect } from 'react';
import { 
  Droplets, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  AlertCircle, 
  Info,
  Navigation,
  Megaphone,
  Plus,
  Send,
  Heart,
  Activity,
  Edit,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface BloodStock {
  id: string;
  facility: string;
  address: string;
  phone: string;
  distance: number;
  stock: {
    [key: string]: {
      status: 'TERSEDIA' | 'MENIPIS' | 'KOSONG';
      count: number;
    };
  };
  lastUpdated: string;
}

interface BloodRequest {
  id: string;
  patientName: string;
  bloodType: string;
  hospital: string;
  contact: string;
  bagsNeeded: number;
  bagsCollected: number;
  message: string;
  timestamp: string;
}

export default function BloodBank({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<'stock' | 'requests' | 'orders'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState<string | null>(null);
  const [bloodDetailModal, setBloodDetailModal] = useState<{ type: string; facilityId: string; facilityName: string; currentCount: number } | null>(null);
  const [bagQuantity, setBagQuantity] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [facilityOrderModal, setFacilityOrderModal] = useState<BloodStock | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [multiOrderQuantities, setMultiOrderQuantities] = useState<Record<string, number>>({});
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(() => {
    const saved = localStorage.getItem('aksi_cepat_incident_location');
    return saved ? JSON.parse(saved) : null;
  });

  const getNavigationUrl = (fac: BloodStock, mode: 'dir' | 'search' = 'dir') => {
    const dest = encodeURIComponent(`${fac.facility}, ${fac.address}`);
    if (mode === 'search') {
      return `https://www.google.com/maps/search/?api=1&query=${dest}`;
    }
    
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (incidentLocation) {
      url += `&origin=${incidentLocation[0]},${incidentLocation[1]}`;
    } else {
      url += `&origin=Current+Location`;
    }
    return url;
  };

  const openFacilityOrder = (facility: BloodStock) => {
    setFacilityOrderModal(facility);
    // Initialize quantities to 0 for all types
    const initial: Record<string, number> = {};
    Object.keys(facility.stock).forEach(type => {
      initial[type] = 0;
    });
    setMultiOrderQuantities(initial);
  };

  const confirmMultiOrder = () => {
    if (!facilityOrderModal) return;

    const statsJson = localStorage.getItem('aksi_cepat_blood_stats');
    let stats = statsJson ? JSON.parse(statsJson) : [
      { type: 'A', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'B', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'AB', request: 0, lastFacility: '-', status: 'Aman' },
      { type: 'O', request: 0, lastFacility: '-', status: 'Aman' }
    ];

    const newOrders: any[] = [];
    let updatedStockData = [...bloodStocks];

    Object.entries(multiOrderQuantities).forEach(([type, qty]) => {
      if (qty > 0) {
        const bloodTypeBase = type.replace(/[+-]/g, '');
        stats = stats.map((s: any) => 
          s.type === bloodTypeBase 
            ? { ...s, request: s.request + qty, lastFacility: facilityOrderModal.facility }
            : s
        );

        // Update Stock Logic
        updatedStockData = updatedStockData.map(f => {
          if (f.id === facilityOrderModal.id) {
            const currentCount = f.stock[type]?.count || 0;
            const newCount = Math.max(0, currentCount - qty);
            const newStatus = newCount > 50 ? 'TERSEDIA' : newCount > 10 ? 'MENIPIS' : newCount > 0 ? 'MENIPIS' : 'KOSONG';
            return {
              ...f,
              lastUpdated: 'Baru saja',
              stock: {
                ...f.stock,
                [type]: { count: newCount, status: newStatus as 'TERSEDIA' | 'MENIPIS' | 'KOSONG' }
              }
            };
          }
          return f;
        });

        newOrders.push({
          id: Math.random().toString(36).substr(2, 9),
          bloodType: type,
          quantity: qty,
          hospital: facilityOrderModal.facility,
          timestamp: new Date().toISOString(),
          status: 'Berhasil Dipesan'
        });
      }
    });

    if (newOrders.length > 0) {
      localStorage.setItem('aksi_cepat_blood_stats', JSON.stringify(stats));
      setBloodStocks(updatedStockData);
      localStorage.setItem('aksi_cepat_blood_facilities', JSON.stringify(updatedStockData));
      const updatedOrders = [...newOrders, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('aksi_cepat_blood_orders', JSON.stringify(updatedOrders));
      setFacilityOrderModal(null);
    }
  };
  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('aksi_cepat_blood_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const handleDeleteOrder = (orderId: string) => {
    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete) return;

    // Optional: Return stock to facility
    const updatedStocks = bloodStocks.map(f => {
      if (f.facility === orderToDelete.hospital) {
        const currentData = f.stock[orderToDelete.bloodType];
        if (currentData) {
          const newCount = currentData.count + orderToDelete.quantity;
          const newStatus = newCount > 50 ? 'TERSEDIA' : newCount > 10 ? 'MENIPIS' : newCount > 0 ? 'MENIPIS' : 'KOSONG';
          return {
            ...f,
            stock: {
              ...f.stock,
              [orderToDelete.bloodType]: { count: newCount, status: newStatus as 'TERSEDIA' | 'MENIPIS' | 'KOSONG' }
            }
          };
        }
      }
      return f;
    });
    setBloodStocks(updatedStocks);
    localStorage.setItem('aksi_cepat_blood_facilities', JSON.stringify(updatedStocks));

    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem('aksi_cepat_blood_orders', JSON.stringify(updated));
  };

  const openEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditQuantity(order.quantity);
  };

  const saveEditedOrder = () => {
    if (!editingOrder) return;

    const diff = editQuantity - editingOrder.quantity;
    
    // Update Stock
    const updatedStocks = bloodStocks.map(f => {
      if (f.facility === editingOrder.hospital) {
        const currentData = f.stock[editingOrder.bloodType];
        if (currentData) {
          const newCount = Math.max(0, currentData.count - diff);
          const newStatus = newCount > 50 ? 'TERSEDIA' : newCount > 10 ? 'MENIPIS' : newCount > 0 ? 'MENIPIS' : 'KOSONG';
          return {
            ...f,
            stock: {
              ...f.stock,
              [editingOrder.bloodType]: { count: newCount, status: newStatus as 'TERSEDIA' | 'MENIPIS' | 'KOSONG' }
            }
          };
        }
      }
      return f;
    });
    setBloodStocks(updatedStocks);
    localStorage.setItem('aksi_cepat_blood_facilities', JSON.stringify(updatedStocks));

    // Update Order
    const updatedOrders = orders.map(o => 
      o.id === editingOrder.id ? { ...o, quantity: editQuantity, timestamp: new Date().toISOString() } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('aksi_cepat_blood_orders', JSON.stringify(updatedOrders));
    setEditingOrder(null);
  };

  // Dynamic Indonesian Hospital List & Stock Generator
  const INDONESIAN_HOSPITALS = [
    // DKI JAKARTA
    { name: 'PMI DKI Jakarta', address: 'Jl. Kramat Raya No.47, Senen, Jakarta Pusat' },
    { name: 'RS Cipto Mangunkusumo (RSCM)', address: 'Jl. Diponegoro No.71, Salemba, Jakarta Pusat' },
    { name: 'RSPAD Gatot Soebroto', address: 'Jl. Abdul Rahman Saleh No.24, Senen, Jakarta Pusat' },
    { name: 'RS Jantung Harapan Kita', address: 'Jl. Letjen S. Parman No. Kav. 87, Palmerah, Jakarta Barat' },
    { name: 'RS Kanker Dharmais', address: 'Jl. Letjen S. Parman No. Kav. 84-86, Palmerah, Jakarta Barat' },
    { name: 'RS Fatmawati', address: 'Jl. RS. Fatmawati Raya No.4, Cilandak, Jakarta Selatan' },
    { name: 'RS Persahabatan', address: 'Jl. Persahabatan Raya No.1, Pulo Gadung, Jakarta Timur' },
    { name: 'RS Medistra', address: 'Jl. Gatot Subroto No. Kav. 59, Setiabudi, Jakarta Selatan' },
    { name: 'RS Metropolitan Medical Centre (MMC)', address: 'Jl. HR Rasuna Said No. Kav. C-21, Setiabudi, Jakarta Selatan' },
    { name: 'RS Siloam Semanggi', address: 'Jl. Garnisun No. Kav. 2-3, Setiabudi, Jakarta Selatan' },
    { name: 'RS Pondok Indah (RSPI)', address: 'Jl. Metro Pondok Indah No. Kav. UE, Kebayoran Lama, Jakarta Selatan' },
    { name: 'RS Pelni Jakarta', address: 'Jl. KS Tubun No.92-94, Palmerah, Jakarta Barat' },
    { name: 'RS Hermina Kemayoran', address: 'Jl. Selangit No. Kav. 4, Kemayoran, Jakarta Pusat' },
    { name: 'RS Mayapada Jakarta Selatan', address: 'Jl. Lebak Bulus 1 No. Kav. 29, Cilandak, Jakarta Selatan' },

    // JAWA BARAT
    { name: 'PMI Kota Bandung', address: 'Jl. Aceh No.79, Sumur Bandung, Kota Bandung' },
    { name: 'RS Hasan Sadikin (RSHS) Bandung', address: 'Jl. Pasteur No.38, Sukajadi, Kota Bandung' },
    { name: 'RS Borromeus Bandung', address: 'Jl. Ir. H. Juanda No.100, Coblong, Kota Bandung' },
    { name: 'RS Advent Bandung', address: 'Jl. Cihampelas No.161, Coblong, Kota Bandung' },
    { name: 'RS Al Islam Bandung', address: 'Jl. Soekarno Hatta No.644, Rancasari, Kota Bandung' },
    { name: 'PMI Kota Bogor', address: 'Jl. Malabar No.17, Bogor Tengah, Kota Bogor' },
    { name: 'RS Azra Bogor', address: 'Jl. Raya Pajajaran No.219, Bogor Utara, Kota Bogor' },
    { name: 'RSUD Kota Bogor', address: 'Jl. Dr. Sumeru No.120, Bogor Barat, Kota Bogor' },
    { name: 'RS Sentosa Bogor', address: 'Jl. Raya Kemang No.18, Kemang, Bogor' },
    { name: 'PMI Kota Depok', address: 'Jl. Boulevard Raya No. Kav. 1, Grand Depok City, Depok' },
    { name: 'RSUI Depok', address: 'Jl. Prof. Dr. Bahder Djohan, Pondok Cina, Depok' },
    { name: 'RS Hermina Depok', address: 'Jl. Siliwangi No.50, Pancoran Mas, Depok' },
    { name: 'PMI Kota Bekasi', address: 'Jl. Pramuka No.1, Bekasi Selatan, Kota Bekasi' },
    { name: 'RSUD Dr. Chasbullah Abdulmadjid Bekasi', address: 'Jl. Pramuka No.55, Bekasi Selatan, Kota Bekasi' },
    { name: 'RS Mitra Keluarga Bekasi', address: 'Jl. Ahmad Yani No. Kav. 1, Bekasi Selatan, Kota Bekasi' },
    { name: 'RS Permata Bekasi', address: 'Jl. Legenda Raya No.9, Mustika Jaya, Kota Bekasi' },

    // JAWA TENGAH & DIY
    { name: 'PMI Kota Yogyakarta', address: 'Jl. Tegalgendu No.25, Kotagede, Yogyakarta' },
    { name: 'RS Dr. Sardjito Yogyakarta', address: 'Jl. Kesehatan No.1, Mlati, Sleman' },
    { name: 'RS JIH Yogyakarta', address: 'Jl. Ring Road Utara No.160, Perumnas Condong Catur, Sleman' },
    { name: 'RS Bethesda Yogyakarta', address: 'Jl. Jend. Sudirman No.70, Gondokusuman, Yogyakarta' },
    { name: 'PMI Kota Semarang', address: 'Jl. Mgr Sugiyopranoto No.31, Semarang Tengah, Kota Semarang' },
    { name: 'RS Dr. Kariadi Semarang', address: 'Jl. Dr. Sutomo No.16, Semarang Selatan, Kota Semarang' },
    { name: 'RS Telogorejo Semarang', address: 'Jl. KH. Ahmad Dahlan, Semarang Tengah, Kota Semarang' },
    { name: 'RS Sultan Agung Semarang', address: 'Jl. Raya Kaligawe KM 4, Genuk, Kota Semarang' },
    { name: 'PMI Kota Surakarta (Solo)', address: 'Jl. Kolonel Sutarto No.58, Jebres, Kota Surakarta' },
    { name: 'RS Dr. Moewardi Solo', address: 'Jl. Kolonel Sutarto No.132, Jebres, Kota Surakarta' },
    { name: 'RS Dr. Oen Solo', address: 'Jl. Brigjend Katamso No.55, Jebres, Kota Surakarta' },
    { name: 'RS Hermina Solo', address: 'Jl. Kolonel Sutarto No.16, Jebres, Kota Surakarta' },
    { name: 'PMI Purwokerto', address: 'Jl. Adyaksa No.8, Purwokerto Timur, Banyumas' },
    { name: 'RSUD Prof. Dr. Margono Soekarjo', address: 'Jl. Dr. Gumbreg No.1, Purwokerto Selatan, Banyumas' },

    // JAWA TIMUR
    { name: 'PMI Kota Surabaya', address: 'Jl. Embong Ploso No.7, Genteng, Kota Surabaya' },
    { name: 'RS Dr. Soetomo Surabaya', address: 'Jl. Mayjen Prof. Dr. Moestopo No.6-8, Gubeng, Kota Surabaya' },
    { name: 'RS Universitas Airlangga', address: 'Kampus C UNAIR, Mulyorejo, Kota Surabaya' },
    { name: 'RS Siloam Surabaya', address: 'Jl. Raya Gubeng No.70, Gubeng, Kota Surabaya' },
    { name: 'RS PHC Surabaya', address: 'Jl. Prapat Kurung No.1, Pabean Cantian, Kota Surabaya' },
    { name: 'PMI Kota Malang', address: 'Jl. Buring No.10, Klojen, Kota Malang' },
    { name: 'RSUD Dr. Saiful Anwar Malang', address: 'Jl. Jaksa Agung Suprapto No.2, Klojen, Kota Malang' },
    { name: 'RS Persada Malang', address: 'Jl. Raden Panji Suroso No.4, Blimbing, Kota Malang' },
    { name: 'PMI Jember', address: 'Jl. S. Parman No.1, Sumbersari, Jember' },
    { name: 'RSUD Dr. Soebandi Jember', address: 'Jl. Dr. Soebandi No.124, Patrang, Jember' },

    // SUMATERA
    { name: 'PMI Kota Medan', address: 'Jl. Palang Merah No.17, Medan Maimun, Kota Medan' },
    { name: 'RS Adam Malik Medan', address: 'Jl. Bunga Lau No.17, Medan Tuntungan, Kota Medan' },
    { name: 'RS Columbia Asia Medan', address: 'Jl. Listrik No.2A, Medan Petisah, Kota Medan' },
    { name: 'RS Siloam Medan', address: 'Jl. Imam Bonjol No.6, Medan Kota, Kota Medan' },
    { name: 'PMI Kota Palembang', address: 'Jl. Kolonel Atmo No.412, Ilir Timur I, Kota Palembang' },
    { name: 'RS Mohammad Hoesin Palembang', address: 'Jl. Jend. Sudirman KM 3.5, Ilir Timur I, Kota Palembang' },
    { name: 'RS Charitas Palembang', address: 'Jl. Jend. Sudirman No.1054, Ilir Timur I, Kota Palembang' },
    { name: 'PMI Kota Padang', address: 'Jl. Sawahan No.62, Padang Timur, Kota Padang' },
    { name: 'RS Dr. M. Djamil Padang', address: 'Jl. Perintis Kemerdekaan, Padang Timur, Kota Padang' },
    { name: 'PMI Kota Lampung', address: 'Jl. Sam Ratulangi No.105, Tanjung Karang Barat, Bandar Lampung' },
    { name: 'RS Abdul Moeloek Lampung', address: 'Jl. Dr. Rivai No.6, Tanjung Karang Pusat, Bandar Lampung' },
    { name: 'PMI Kota Banda Aceh', address: 'Jl. Prof. A. Majid Ibrahim No.4, Meuraxa, Banda Aceh' },
    { name: 'RS Zainoel Abidin Banda Aceh', address: 'Jl. Tgk Daud Beureueh No.108, Kuta Alam, Banda Aceh' },
    { name: 'PMI Kota Pekanbaru', address: 'Jl. Ahmad Dahlan No.8, Sukajadi, Pekanbaru' },
    { name: 'RS Arifin Achmad Pekanbaru', address: 'Jl. Diponegoro No.2, Pekanbaru Kota, Pekanbaru' },
    { name: 'PMI Kota Batam', address: 'Jl. S. Parman, Bengkong Laut, Batam' },
    { name: 'RS Awal Bros Batam', address: 'Jl. Gajah Mada No. Kav. 1, Baloi, Batam' },

    // BALI & NUSA TENGGARA
    { name: 'PMI Provinsi Bali', address: 'Jl. Imam Bonjol No.182, Denpasar Barat, Kota Denpasar' },
    { name: 'RS Sanglah Denpasar', address: 'Jl. Diponegoro, Denpasar Barat, Kota Denpasar' },
    { name: 'RS Prima Medika Denpasar', address: 'Jl. Pulau Serangan No.9, Denpasar Selatan, Kota Denpasar' },
    { name: 'RS Kasih Ibu Denpasar', address: 'Jl. Teuku Umar No.120, Denpasar Barat, Kota Denpasar' },
    { name: 'PMI Kota Mataram', address: 'Jl. Pariwisata No.17, Mataram, Kota Mataram' },
    { name: 'RSUD NTB Mataram', address: 'Jl. Prabu Rangkasari, Dasan Cermen, Kota Mataram' },
    { name: 'PMI Kota Kupang', address: 'Jl. Frans Seda, Kelapa Lima, Kota Kupang' },
    { name: 'RSUD Prof. Dr. W. Z. Johannes Kupang', address: 'Jl. Dr. Moh. Hatta No.19, Kota Raja, Kota Kupang' },

    // KALIMANTAN
    { name: 'PMI Kota Banjarmasin', address: 'Jl. S. Parman No.1, Banjarmasin Tengah, Kota Banjarmasin' },
    { name: 'RSUD Ulin Banjarmasin', address: 'Jl. Ahmad Yani KM 2.5, Banjarmasin Tengah, Kota Banjarmasin' },
    { name: 'PMI Kota Pontianak', address: 'Jl. Ahmad Yani No.1, Pontianak Tenggara, Kota Pontianak' },
    { name: 'RSUD dr. Soedarso Pontianak', address: 'Jl. Dr. Soedarso No.1, Pontianak Tenggara, Kota Pontianak' },
    { name: 'PMI Kota Balikpapan', address: 'Jl. Jenderal Sudirman No. Kav. 1, Balikpapan Kota, Kota Balikpapan' },
    { name: 'RSUD Dr. Kanujoso Djatiwibowo Balikpapan', address: 'Jl. MT Haryono No.656, Balikpapan Utara, Kota Balikpapan' },
    { name: 'PMI Kota Samarinda', address: 'Jl. Dr. Sutomo No.16, Samarinda Ulu, Kota Samarinda' },
    { name: 'RSUD Abdul Wahab Sjahranie Samarinda', address: 'Jl. Dr. Soetomo No.1, Samarinda Ulu, Kota Samarinda' },

    // SULAWESI
    { name: 'PMI Kota Makassar', address: 'Jl. Kandea No.16, Bontoala, Kota Makassar' },
    { name: 'RS Dr. Wahidin Sudirohusodo Makassar', address: 'Jl. Perintis Kemerdekaan KM 11, Tamalanrea, Kota Makassar' },
    { name: 'RS Siloam Makassar', address: 'Jl. Metro Tanjung Bunga No. Kav. 9, Mariso, Kota Makassar' },
    { name: 'RS Stella Maris Makassar', address: 'Jl. Somba Opu No.273, Losari, Kota Makassar' },
    { name: 'PMI Kota Manado', address: 'Jl. Balai Kota No.1, Tikala, Kota Manado' },
    { name: 'RS Prof. Dr. RD Kandou Manado', address: 'Jl. Raya Tanawangko No.56, Malalayang, Kota Manado' },
    { name: 'PMI Kota Palu', address: 'Jl. Kartini No.1, Palu Timur, Kota Palu' },
    { name: 'RSUD Undata Palu', address: 'Jl. Trans Sulawesi KM 7, Tondo, Kota Palu' },

    // PAPUA & MALUKU
    { name: 'PMI Kota Jayapura', address: 'Jl. Ahmad Yani, Gurabesi, Kota Jayapura' },
    { name: 'RSUD Jayapura', address: 'Jl. Kesehatan No.1, Dok II, Kota Jayapura' },
    { name: 'RS Provita Jayapura', address: 'Jl. Dr. Sam Ratulangi No.39, Bayangkara, Kota Jayapura' },
    { name: 'PMI Kota Ambon', address: 'Jl. Dr. Kayadoe, Benteng, Ambon' },
    { name: 'RS Dr. M. Haulussy Ambon', address: 'Jl. Dr. Kayadoe No.1, Ambon' },
    { name: 'PMI Kota Sorong', address: 'Jl. Ahmad Yani No.14, Sorong Kota, Sorong' },
    { name: 'RSUD Sele Be Solu Sorong', address: 'Jl. Poros KM 12, Sorong Timur, Sorong' }
  ];

  const [bloodStocks, setBloodStocks] = useState<BloodStock[]>(() => {
    const saved = localStorage.getItem('aksi_cepat_blood_facilities');
    if (saved) return JSON.parse(saved);
    return INDONESIAN_HOSPITALS.map((hospitalObj, index) => {
      const { name, address } = hospitalObj;
      // Create varied but realistic stock data
      const isLow = index % 4 === 0;
      const getRandStatus = (type: string) => {
        if (isLow && (type === 'AB+' || type === 'O-')) return { status: 'MENIPIS' as const, count: Math.floor(Math.random() * 5) + 1 };
        const rand = Math.random();
        if (rand > 0.8) return { status: 'KOSONG' as const, count: 0 };
        if (rand > 0.5) return { status: 'MENIPIS' as const, count: Math.floor(Math.random() * 8) + 1 };
        return { status: 'TERSEDIA' as const, count: Math.floor(Math.random() * 80) + 10 };
      };

      const lastUpdateOptions = ['Baru saja', '5 menit lalu', '15 menit lalu', '1 jam lalu', '30 menit lalu'];
      
      return {
        id: `hsp-${index}`,
        facility: name,
        address: address,
        phone: `021-${Math.floor(1000000 + Math.random() * 9000000)}`,
        distance: Number((Math.random() * 20 + 0.5).toFixed(1)),
        stock: {
          'A+': getRandStatus('A+'),
          'B+': getRandStatus('B+'),
          'O+': getRandStatus('O+'),
          'AB+': getRandStatus('AB+'),
          'A-': { status: 'KOSONG', count: 0 },
          'B-': { status: 'KOSONG', count: 0 },
          'O-': { status: index % 7 === 0 ? 'MENIPIS' : 'KOSONG', count: index % 7 === 0 ? 3 : 0 },
          'AB-': { status: 'KOSONG', count: 0 },
        },
        lastUpdated: lastUpdateOptions[Math.floor(Math.random() * lastUpdateOptions.length)]
      };
    });
  });

  const [requests, setRequests] = useState<BloodRequest[]>([
    {
      id: 'req1',
      patientName: 'Bp. Ahmad Subagjo',
      bloodType: 'AB+',
      hospital: 'RS Cipto Mangunkusumo',
      contact: '0812-xxxx-xxxx',
      bagsNeeded: 5,
      bagsCollected: 2,
      message: 'Butuh segera untuk operasi jantung besok pagi. Mohon bantuannya.',
      timestamp: '2 jam lalu'
    },
    {
      id: 'req2',
      patientName: 'Ibu Siti Fatimah',
      bloodType: 'O-',
      hospital: 'RS Medika Utama',
      contact: '0878-xxxx-xxxx',
      bagsNeeded: 3,
      bagsCollected: 0,
      message: 'Darah golongan O negatif sangat terbatas di bank darah RS. Emergency!',
      timestamp: '5 jam lalu'
    }
  ]);

  const bloodTypes = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

  const filteredStocks = bloodStocks.filter(s => {
    const search = (searchTerm || '').toLowerCase();
    const facility = (s.facility || '').toLowerCase();
    const address = (s.address || '').toLowerCase();
    
    const hasMatchingType = Object.keys(s.stock || {}).some(type => {
      const t = type.toLowerCase();
      const tBase = type.replace(/[+-]/g, '').toLowerCase();
      return t.includes(search) || (search.length > 0 && search.includes(t)) || (search.length > 0 && search.includes(tBase));
    });

    const matchesSearch = facility.includes(search) || address.includes(search) || hasMatchingType;
    
    if (!selectedBloodType) return matchesSearch;
    
    // If blood type filter is active, check if this facility has available stock for that specific type
    return matchesSearch && s.stock && Object.entries(s.stock).some(([type, data]) => 
      type.startsWith(selectedBloodType) && data.count > 0
    );
  });

  const filteredOrders = orders.filter(order => {
    const search = (searchTerm || '').toLowerCase();
    const hospital = (order.hospital || '').toLowerCase();
    const bloodType = (order.bloodType || '').toLowerCase();
    const status = (order.status || '').toLowerCase();
    
    return hospital.includes(search) || bloodType.includes(search) || status.includes(search);
  });

  const filteredRequests = (requests || []).filter(req => {
    const search = (searchTerm || '').toLowerCase();
    const name = (req.patientName || '').toLowerCase();
    const hospital = (req.hospital || '').toLowerCase();
    const bloodType = (req.bloodType || '').toLowerCase();
    const message = (req.message || '').toLowerCase();
    
    return name.includes(search) || hospital.includes(search) || bloodType.includes(search) || message.includes(search);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TERSEDIA': return 'bg-emerald-500';
      case 'MENIPIS': return 'bg-amber-500';
      case 'KOSONG': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  const handleBloodTypeClick = (bloodType: string, facilityId: string, facilityName: string, count: number) => {
    setBloodDetailModal({ type: bloodType, facilityId, facilityName, currentCount: count });
    setBagQuantity(user.role === 'ADMIN' ? count : 1);
    setIsEditMode(user.role === 'ADMIN');
  };

  const confirmBloodRequest = () => {
    if (!bloodDetailModal) return;
    
    if (isEditMode) {
      // Admin updating stock
      const updatedStock = bloodStocks.map(f => {
        if (f.id === bloodDetailModal.facilityId) {
          const newStatus = bagQuantity > 50 ? 'TERSEDIA' : bagQuantity > 10 ? 'MENIPIS' : bagQuantity > 0 ? 'MENIPIS' : 'KOSONG';
          return {
            ...f,
            lastUpdated: 'Baru saja',
            stock: {
              ...f.stock,
              [bloodDetailModal.type]: { count: bagQuantity, status: newStatus as 'TERSEDIA' | 'MENIPIS' | 'KOSONG' }
            }
          };
        }
        return f;
      });
      setBloodStocks(updatedStock);
      localStorage.setItem('aksi_cepat_blood_facilities', JSON.stringify(updatedStock));
    } else {
      // User requesting stock (Ordering)
      const bloodTypeBase = bloodDetailModal.type.replace(/[+-]/g, ''); 
      const statsJson = localStorage.getItem('aksi_cepat_blood_stats');
      
      let stats;
      if (statsJson) {
        stats = JSON.parse(statsJson);
      } else {
        stats = [
          { type: 'A', request: 0, lastFacility: '-', status: 'Aman' },
          { type: 'B', request: 0, lastFacility: '-', status: 'Aman' },
          { type: 'AB', request: 0, lastFacility: '-', status: 'Aman' },
          { type: 'O', request: 0, lastFacility: '-', status: 'Aman' }
        ];
      }

      const updatedStats = stats.map((s: any) => 
        s.type === bloodTypeBase 
          ? { ...s, request: s.request + bagQuantity, lastFacility: bloodDetailModal.facilityName }
          : s
      );
      localStorage.setItem('aksi_cepat_blood_stats', JSON.stringify(updatedStats));

      // REDUCE ACTUAL STOCK
      const updatedStockData = bloodStocks.map(f => {
        if (f.id === bloodDetailModal.facilityId) {
          const currentCount = f.stock[bloodDetailModal.type]?.count || 0;
          const newCount = Math.max(0, currentCount - bagQuantity);
          const newStatus = newCount > 50 ? 'TERSEDIA' : newCount > 10 ? 'MENIPIS' : newCount > 0 ? 'MENIPIS' : 'KOSONG';
          return {
            ...f,
            lastUpdated: 'Baru saja',
            stock: {
              ...f.stock,
              [bloodDetailModal.type]: { count: newCount, status: newStatus as 'TERSEDIA' | 'MENIPIS' | 'KOSONG' }
            }
          };
        }
        return f;
      });
      setBloodStocks(updatedStockData);
      localStorage.setItem('aksi_cepat_blood_facilities', JSON.stringify(updatedStockData));

      // Create Order Entry
      const newOrder = {
        id: Math.random().toString(36).substr(2, 9),
        bloodType: bloodDetailModal.type,
        quantity: bagQuantity,
        hospital: bloodDetailModal.facilityName,
        timestamp: new Date().toISOString(),
        status: 'Berhasil Dipesan'
      };
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('aksi_cepat_blood_orders', JSON.stringify(updatedOrders));
    }
    
    setBloodDetailModal(null);
  };

  const handleCreateRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRequest: BloodRequest = {
      id: Math.random().toString(36).substr(2, 9),
      patientName: formData.get('patientName') as string,
      bloodType: formData.get('bloodType') as string,
      hospital: formData.get('hospital') as string,
      contact: formData.get('contact') as string,
      bagsNeeded: Number(formData.get('bagsNeeded')),
      bagsCollected: 0,
      message: formData.get('message') as string,
      timestamp: 'Baru saja'
    };
    setRequests([newRequest, ...requests]);
    setShowRequestForm(false);

    // Update analytics stats
    const statsJson = localStorage.getItem('aksi_cepat_blood_stats');
    if (statsJson) {
      const stats = JSON.parse(statsJson);
      const bloodTypeBase = newRequest.bloodType.replace(/[+-]/g, ''); // A+, A- -> A
      const updatedStats = stats.map((s: any) => 
        s.type === bloodTypeBase 
          ? { ...s, request: s.request + 1, lastFacility: newRequest.hospital }
          : s
      );
      localStorage.setItem('aksi_cepat_blood_stats', JSON.stringify(updatedStats));
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] italic">Real-time Blood Supply</p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Blood Bank <span className="text-rose-600">Connect.</span></h1>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative group/search min-w-[300px]">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-rose-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Cari RS/Tipe/Status..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-500/5 transition-all shadow-inner"
             />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Stok
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'orders' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pesan
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] rounded-full flex items-center justify-center border border-white font-black">
                  {orders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Urgensi
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'stock' ? (
        <div className="space-y-8">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
             <div className="bg-white border border-slate-200 rounded-[20px] p-1.5 flex items-center gap-1 shadow-sm overflow-x-auto">
                {['Semua', 'A', 'B', 'O', 'AB'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedBloodType(type === 'Semua' ? null : type)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      (selectedBloodType === type || (type === 'Semua' && !selectedBloodType))
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                      : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[32px] flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-0.5">Notifikasi Kritis: AB+</p>
                <p className="text-sm text-rose-600/80 font-medium italic">Ketersediaan golongan darah AB+ sedang menipis di area Jakarta Selatan. Harap pertimbangkan untuk donor di Unit PMI terdekat.</p>
             </div>
          </div>

          {/* List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {filteredStocks.map(s => (
               <motion.div 
                 key={s.id}
                 layout
                 className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm hover:shadow-xl transition-all group"
               >
                  <div className="space-y-6">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-slate-900 italic tracking-tight">{s.facility}</h3>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-1">{s.address}</p>
                           <a 
                             href={getNavigationUrl(s, 'search')}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors group/nav"
                           >
                              <MapPin className="w-3 h-3 transition-transform group-hover/nav:scale-125" /> {s.distance} KM dari Anda (LIHAT MAPS)
                           </a>
                        </div>
                        <div className="flex items-center gap-2">
                           {user.role === 'ADMIN' && (
                             <button 
                               onClick={() => openFacilityOrder(s)}
                               className="px-4 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 border border-rose-100"
                             >
                               Pesan
                             </button>
                           )}
                           <a 
                             href={getNavigationUrl(s, 'dir')}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-90"
                             title="Navigasi Rute ke Lokasi"
                           >
                              <Navigation className="w-5 h-5" />
                           </a>
                        </div>
                     </div>

                      <div id={`blood-grid-${s.id}`} className="grid grid-cols-4 gap-2 transition-all duration-500 rounded-2xl p-1">
                        {bloodTypes.map(bt => {
                          const item = s.stock[bt];
                          const status = item?.status || 'KOSONG';
                          const count = item?.count || 0;
                          return (
                             <button 
                              key={bt} 
                              disabled={count === 0 && user.role !== 'ADMIN'}
                              onClick={() => handleBloodTypeClick(bt, s.id, s.facility, count)}
                              className="flex flex-col items-center gap-1 group/bt outline-none transition-all active:scale-90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                               <div className={`w-full py-2 rounded-lg flex flex-col items-center justify-center text-[10px] font-black transition-all ${
                                 status === 'TERSEDIA' ? 'bg-emerald-50 text-emerald-600 group-hover/bt:bg-emerald-100' :
                                 status === 'MENIPIS' ? 'bg-amber-50 text-amber-600 group-hover/bt:bg-amber-100' :
                                 'bg-slate-100 text-slate-400'
                               }`}>
                                 <span>{bt}</span>
                                 <span className="text-[8px] opacity-60 leading-none mt-0.5 whitespace-nowrap text-center">
                                   {count > 0 ? `${count} Bags` : 'STOK HABIS'}
                                 </span>
                               </div>
                               <div className={`w-1.5 h-1.5 rounded-full transition-transform group-hover/bt:scale-150 ${getStatusColor(status)}`}></div>
                            </button>
                          );
                        })}
                      </div>

                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase italic">Update: {s.lastUpdated}</span>
                        </div>
                        <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                           <Phone className="w-3 h-3" /> Hubungi
                        </a>
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 shadow-sm border border-rose-100">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center mb-4 text-slate-900 group-hover:border-rose-200 transition-colors">
                    <span className="text-[10px] font-bold opacity-40 uppercase leading-none mb-1">GOL</span>
                    <span className="text-xl font-black">{order.bloodType}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">{order.quantity} Kantong</h3>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">{order.hospital}</p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-100/50">
                      {order.status}
                    </span>
                    <button 
                      onClick={() => openEditOrder(order)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 hover:border-indigo-100 shadow-sm"
                      title="Edit Pesanan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all border border-rose-100 shadow-sm"
                      title="Hapus Pesanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200">
                <Send className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Belum Ada Pesanan</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium">Anda belum melakukan pesanan stok darah. Silakan pilih stok tersedia di tab Stok Darah.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                 <Megaphone className="w-6 h-6 text-rose-600" />
                 <h3 className="text-xl font-black text-slate-900 italic uppercase">Permintaan Donor Mendesak</h3>
              </div>
              <button 
                onClick={() => setShowRequestForm(true)}
                className="flex items-center gap-2 px-6 py-4 bg-rose-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                 <Plus className="w-5 h-5" /> Buat Pengumuman
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatePresence>
                {filteredRequests.map(req => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm relative overflow-hidden group"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-40 group-hover:bg-rose-100 transition-colors"></div>
                     
                     <div className="relative z-10 flex flex-col h-full gap-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-rose-900 text-white rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-rose-200">
                                 <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Goldar</span>
                                 <span className="text-2xl font-black leading-none">{req.bloodType}</span>
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-slate-900 m-0 leading-tight italic">{req.patientName}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{req.hospital}</p>
                                 <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-rose-500" />
                                    <span className="text-[10px] font-black text-rose-500 uppercase italic">{req.timestamp}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="hidden sm:block">
                              <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-200">Urgent</span>
                           </div>
                        </div>

                        <div className="flex-1">
                           <p className="text-slate-600 font-medium italic text-sm leading-relaxed quote-mark">
                              "{req.message}"
                           </p>
                        </div>

                        <div className="space-y-4">
                           <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Koleksi</span>
                                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{req.bagsCollected} / {req.bagsNeeded} Kantong</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-rose-600 transition-all duration-1000"
                                   style={{ width: `${(req.bagsCollected / req.bagsNeeded) * 100}%` }}
                                 ></div>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                 <Send className="w-3.5 h-3.5" /> Saya Bisa Donor
                              </button>
                              <a href={`tel:${req.contact}`} className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0">
                                 <Phone className="w-5 h-5" />
                              </a>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      )}

      {/* Request Form Modal */}
      <AnimatePresence>
        {showRequestForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowRequestForm(false)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative bg-white w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col"
             >
                <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                   <div className="flex items-center gap-3 mb-2">
                      <Megaphone className="w-6 h-6 text-rose-600" />
                      <h3 className="text-2xl font-black text-slate-900 italic uppercase">Butuh Darah Segera</h3>
                   </div>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Lengkapi detail pasien untuk mendapatkan donor tepat</p>
                </div>

                <form onSubmit={handleCreateRequest} className="p-10 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pasien</label>
                         <input name="patientName" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20" placeholder="Contoh: Budi Santoso" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Golongan Darah</label>
                         <select name="bloodType" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20">
                            {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rumah Sakit</label>
                         <input 
                           name="hospital" 
                           list="hospital-list"
                           required 
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20" 
                           placeholder="Nama RS" 
                         />
                         <datalist id="hospital-list">
                            {INDONESIAN_HOSPITALS.map((hospital, idx) => (
                               <option key={idx} value={hospital.name} />
                            ))}
                         </datalist>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Butuh Berapa Kantong</label>
                         <input name="bagsNeeded" type="number" required defaultValue={1} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kontak Keluarga / Pendamping</label>
                      <input name="contact" required placeholder="0812-xxxx-xxxx" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20" />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesan Tambahan</label>
                      <textarea name="message" rows={3} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 resize-none" placeholder="Tuliskan alasan urgensi..." />
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                      <button type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">Kirim Pengumuman</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Facility Order Modal */}
      <AnimatePresence>
        {facilityOrderModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFacilityOrderModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 bg-rose-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-tight">{facilityOrderModal.facility}</h3>
                  <p className="text-rose-100/70 text-[10px] font-black uppercase tracking-[0.2em]">PESAN LOGISTIK DARAH</p>
                </div>
                <div className="px-4 py-1.5 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm shrink-0 mx-auto md:mx-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white">ID: {facilityOrderModal.id.slice(0, 8)}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="max-h-[350px] overflow-y-auto rounded-3xl border border-slate-100 shadow-sm bg-slate-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Golongan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status Stok</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Jumlah Pesan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloodTypes.map((type) => {
                        const stockItem = facilityOrderModal.stock[type];
                        return (
                          <tr key={type} className={cn("group hover:bg-white transition-colors border-b border-slate-100 last:border-0 text-slate-900 font-bold", stockItem.count === 0 && "opacity-50 grayscale")}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors",
                                  stockItem.count > 0 ? "bg-slate-100 group-hover:bg-rose-50 group-hover:text-rose-600" : "bg-slate-100 text-slate-400"
                                )}>
                                  {type}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-center flex justify-center",
                                stockItem.count === 0 ? "bg-slate-100 text-slate-400" : stockItem.count < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {stockItem.count > 0 ? `${stockItem.count} Bags` : 'STOK HABIS'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <button 
                                  disabled={stockItem.count === 0}
                                  onClick={() => setMultiOrderQuantities(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))}
                                  className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  -
                                </button>
                                <span className={cn("w-8 text-center text-sm font-black tabular-nums", stockItem.count === 0 && "text-slate-300")}>{multiOrderQuantities[type] || 0}</span>
                                <button 
                                  disabled={stockItem.count === 0}
                                  onClick={() => setMultiOrderQuantities(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }))}
                                  className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex flex-col md:flex-row items-center gap-3">
                  <button 
                    onClick={() => setFacilityOrderModal(null)}
                    className="w-full md:w-1/3 py-4 bg-slate-100 text-slate-500 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-sm"
                  >
                    TIDAK, BATAL
                  </button>
                  <button 
                    onClick={confirmMultiOrder}
                    disabled={Object.values(multiOrderQuantities).every(q => q === 0)}
                    className="w-full md:w-2/3 py-4 bg-rose-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                  >
                    <Send className="w-4 h-4" /> YA, KONFIRMASI PESANAN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrder(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 bg-indigo-600 text-white flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-white/20 rounded-[28px] flex flex-col items-center justify-center border border-white/30 backdrop-blur-md shadow-xl">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1 text-white">GOL</span>
                  <span className="text-3xl font-black">{editingOrder.bloodType}</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tighter uppercase italic">{editingOrder.hospital}</h3>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Ubah Pesanan Darah</p>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">JUMLAH KANTONG BARU</p>
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                      className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <span className="text-2xl font-black leading-none">-</span>
                    </button>
                    <div className="text-5xl font-black text-slate-900 min-w-[4rem] text-center tracking-tighter">{editQuantity}</div>
                    <button 
                      onClick={() => setEditQuantity(editQuantity + 1)}
                      className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <span className="text-2xl font-black leading-none">+</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={saveEditedOrder}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 hover:bg-indigo-700"
                  >
                    Simpan Perubahan
                  </button>
                  <button 
                    onClick={() => setEditingOrder(null)}
                    className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blood Detail / Confirmation Modal */}
      <AnimatePresence>
        {bloodDetailModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBloodDetailModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className={cn("p-10 text-white flex flex-col items-center text-center space-y-4", isEditMode ? "bg-indigo-600" : "bg-rose-600")}>
                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex flex-col items-center justify-center border border-white/30 backdrop-blur-md shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">GOLONGAN</span>
                  <span className="text-4xl font-black">{bloodDetailModal.type}</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic">{bloodDetailModal.facilityName}</h3>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                    {isEditMode ? 'KELOLA PERSEDIAAN STOK' : 'KONFIRMASI PESANAN DARAH'}
                  </p>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                    {isEditMode ? 'PEMBARUAN JUMLAH STOK' : 'JUMLAH KANTONG PESANAN'}
                  </p>
                  <div className="flex items-center justify-center gap-8">
                    <button 
                      onClick={() => setBagQuantity(Math.max(0, bagQuantity - (isEditMode ? 5 : 1)))}
                      className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100 hover:border-slate-200 active:scale-90"
                    >
                      <span className="text-3xl font-black leading-none">-</span>
                    </button>
                    <div className="text-6xl font-black text-slate-900 min-w-[5rem] text-center tracking-tighter">{bagQuantity}</div>
                    <button 
                      onClick={() => setBagQuantity(bagQuantity + (isEditMode ? 5 : 1))}
                      className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100 hover:border-slate-200 active:scale-90"
                    >
                      <span className="text-3xl font-black leading-none">+</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className={cn("p-6 rounded-3xl border flex items-center gap-4 transition-all", isEditMode ? "bg-indigo-50 border-indigo-100" : "bg-rose-50 border-rose-100")}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isEditMode ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-600")}>
                      {isEditMode ? <Edit className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 leading-relaxed uppercase tracking-wider">
                      {isEditMode 
                        ? "Pembaruan stok akan langsung terlihat oleh seluruh pengguna di sistem pencarian."
                        : "Pesanan Anda akan langsung tercatat di sistem logistik rumah sakit untuk disiapkan."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button 
                      onClick={() => setBloodDetailModal(null)}
                      className="py-5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                    >
                      TIDAK, BATAL
                    </button>
                    <button 
                      onClick={confirmBloodRequest}
                      disabled={!isEditMode && (bagQuantity > bloodDetailModal.currentCount || bloodDetailModal.currentCount === 0 || bagQuantity === 0)}
                      className={cn(
                        "py-5 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100",
                        isEditMode ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                      )}
                    >
                      {isEditMode ? <><Activity className="w-4 h-4" /> YA, SIMPAN</> : <><Send className="w-4 h-4" /> YA, PESAN SEKARANG</>}
                    </button>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

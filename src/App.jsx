import React, { useState, useEffect, useMemo } from 'react';
// Importamos los iconos nuevos
import { 
  ArrowRightLeft, Lock, Save, Phone, Search, Globe, Clock, CheckCircle2, AlertCircle, RotateCw, Wifi, WifiOff, CloudCog,
  User, Users, History, LogOut, Plus, X, ArrowLeft, Trash2, Banknote, Landmark, Smartphone, Hash, Mail, FileText, ChevronDown,
  Edit2, // Icono para el apodo
  UserCheck // Icono para destinatario seleccionado
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
// Importamos las nuevas funciones de Autenticación de Clientes
import { 
  getAuth, signInAnonymously, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
// Importamos las nuevas funciones de Firestore (addDoc, collection, query, where, deleteDoc)
import { 
  getFirestore, doc, setDoc, onSnapshot,
  addDoc, collection, query, deleteDoc
} from 'firebase/firestore';


// ------------------------------------------------------------------
// PASO 1: PEGA AQUÍ TUS CREDENCIALES DE FIREBASE
// (Las que obtuviste de tu consola de Firebase)
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCPEUxbaX83eBPoIfj9I0WXfJl69qMWAbA",
  authDomain: "cripto-cambios-d8860.firebaseapp.com",
  projectId: "cripto-cambios-d8860",
  storageBucket: "cripto-cambios-d8860.firebasestorage.app",
  messagingSenderId: "161882132231",
  appId: "1:161882132231:web:cad537a197f77a033c3fa2",
  measurementId: "G-5ZYLE2D4TJ"
};
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// PASO 2: DEFINE TU PIN DE ADMINISTRADOR
// (El que usas para editar las tasas)
// ------------------------------------------------------------------
const ADMIN_PIN = "1505"; // <--- ¡¡CAMBIA ESTO POR TU PIN!!
// ------------------------------------------------------------------

// Inicialización de Firebase (SIN DUPLICADOS)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CONFIGURACIÓN (Usa un ID único para tu app)
const appId = "cripto_cambios_web_prod"; 

// --- Configuración de Países ---
const COUNTRIES = [
  { code: 'PE', name: 'Perú', currency: 'PEN', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', flag: '🇺🇸' },
  { code: 'VE', name: 'Venezuela', currency: 'VES', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', flag: '🇪🇨' },
  { code: 'MX', name: 'México', currency: 'MXN', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'EU', name: 'Europa', currency: 'EUR', flag: '🇪🇺' },
];

// Solo los países con reglas de destinatario definidas
const BENEFICIARY_COUNTRIES = COUNTRIES.filter(c => ['PE', 'CL', 'VE', 'CO', 'EC', 'BR', 'MX', 'US'].includes(c.code));

// --- Rutas Maestras ---
const MASTER_ROUTES = [
  // ... (Tu lista de 34 rutas sigue aquí, no la modifico) ...
  { id: 'pe_ve', from: 'PE', to: 'VE', rate: 12.50 },
  { id: 've_pe', from: 'VE', to: 'PE', rate: 0.075 },
  { id: 'cl_ve', from: 'CL', to: 'VE', rate: 0.042 },
  { id: 've_cl', from: 'VE', to: 'CL', rate: 22.0 },
  { id: 'br_ve', from: 'BR', to: 'VE', rate: 7.5 },
  { id: 've_br', from: 'VE', to: 'BR', rate: 0.12 },
  { id: 'us_ve', from: 'US', to: 'VE', rate: 45.0 },
  { id: 've_us', from: 'VE', to: 'US', rate: 0.021 },
  { id: 'co_ve', from: 'CO', to: 'VE', rate: 0.011 },
  { id: 've_co', from: 'VE', to: 'CO', rate: 85.0 },
  { id: 'mx_ve', from: 'MX', to: 'VE', rate: 2.2 },
  { id: 've_mx', from: 'VE', to: 'MX', rate: 0.40 },
  { id: 've_ec', from: 'VE', to: 'EC', rate: 0.021 },
  { id: 'pe_cl', from: 'PE', to: 'CL', rate: 250 },
  { id: 'cl_pe', from: 'CL', to: 'PE', rate: 0.0038 },
  { id: 'pe_co', from: 'PE', to: 'CO', rate: 1050 },
  { id: 'co_pe', from: 'CO', to: 'PE', rate: 0.00090 },
  { id: 'br_pe', from: 'BR', to: 'PE', rate: 0.65 },
  { id: 'pe_br', from: 'PE', to: 'BR', rate: 1.45 },
  { id: 'pe_ec', from: 'PE', to: 'EC', rate: 0.26 },
  { id: 'co_cl', from: 'CO', to: 'CL', rate: 0.23 },
  { id: 'cl_co', from: 'CL', to: 'CO', rate: 4.1 },
  { id: 'br_cl', from: 'BR', to: 'CL', rate: 165 },
  { id: 'cl_br', from: 'CL', to: 'BR', rate: 0.0058 },
  { id: 'us_pe', from: 'US', to: 'PE', rate: 3.74 },
  { id: 'pe_us', from: 'PE', to: 'US', rate: 0.26 },
  { id: 'us_cl', from: 'US', to: 'CL', rate: 940 },
  { id: 'cl_us', from: 'CL', to: 'US', rate: 0.0010 },
  { id: 'co_us', from: 'CO', to: 'US', rate: 0.00025 },
  { id: 'us_co', from: 'US', to: 'CO', rate: 3900 },
  { id: 'br_us', from: 'BR', to: 'US', rate: 0.19 },
  { id: 'us_br', from: 'US', to: 'BR', rate: 5.10 },
  { id: 'us_ec', from: 'US', to: 'EC', rate: 1.0 },
  { id: 'eu_ve', from: 'EU', to: 'VE', rate: 48.0 },
  { id: 've_eu', from: 'VE', to: 'EU', rate: 0.019 },
];

// --- Componente Tarjeta de Destinatario (MODIFICADO) ---
// Ahora muestra los datos de TODOS los países
function BeneficiaryCard({ d, onDelete, getCountry, onSend }) { // <-- AÑADIDO onSend
  const countryFlag = getCountry(d.country).flag;
  let title = '';
  let details = [];

  const apodo = d.details.apodo || 'Destinatario';
  const nombreCompleto = `${d.details.nombre || ''} ${d.details.apellido || ''}`.trim();
  const nombre = nombreCompleto ? { icon: User, label: "Nombre", value: nombreCompleto } : null;

  switch(d.country) {
    case 'VE':
      title = "Pago Móvil (VE)";
      details = [
        nombre,
        { icon: FileText, label: "Cédula", value: d.details.cedula },
        { icon: Landmark, label: "Banco", value: d.details.banco },
        { icon: Smartphone, label: "Teléfono", value: d.details.telefono },
      ];
      break;
    case 'CL':
      title = "Transferencia (CL)";
      details = [
        nombre,
        { icon: FileText, label: "RUT", value: d.details.rut },
        { icon: Landmark, label: "Banco", value: d.details.banco },
        { icon: Hash, label: "Tipo Cuenta", value: d.details.tipoCuenta },
        { icon: Banknote, label: "N° Cuenta", value: d.details.cuenta },
        { icon: Mail, label: "Email", value: d.details.email },
      ];
      break;
    case 'PE':
      if (d.method === 'TRANSFERENCIA') {
        title = "Transferencia (PE)";
        details = [
          nombre,
          { icon: FileText, label: d.details.tipoDocumento || 'Documento', value: d.details.documento },
          { icon: Banknote, label: "N° Cuenta", value: d.details.cuenta },
          d.details.cci && { icon: Hash, label: "CCI", value: d.details.cci },
        ];
      } else {
        title = `${d.method} (PE)`; // "Yape (PE)" o "Plin (PE)"
        details = [
          nombre,
          { icon: Smartphone, label: "Teléfono", value: d.details.telefono },
        ];
      }
      break;
    case 'CO':
      if (d.method === 'NEQUI') {
        title = "Nequi (CO)";
        details = [
          nombre,
          { icon: Smartphone, label: "Teléfono", value: d.details.telefono },
          d.details.cedula && { icon: FileText, label: "Cédula", value: d.details.cedula }, // Opcional
        ];
      } else { // BANCOLOMBIA
        title = "Bancolombia (CO)";
        details = [
          nombre,
          { icon: FileText, label: "Cédula", value: d.details.cedula },
          { icon: Hash, label: "Tipo Cuenta", value: d.details.tipoCuenta },
          { icon: Banknote, label: "N° Cuenta", value: d.details.cuenta },
        ];
      }
      break;
    case 'BR':
      title = "PIX (BR)";
      details = [
        nombre,
        { icon: Hash, label: "PIX", value: d.details.numero_pix },
      ];
      break;
    case 'MX':
      title = "Transferencia (MX)";
      details = [
        nombre,
        { icon: Landmark, label: "Banco", value: d.details.banco },
        { icon: Banknote, label: "N° Cuenta (CLABE)", value: d.details.cuenta },
        { icon: Hash, label: "Tipo Cuenta", value: d.details.tipoCuenta },
      ];
      break;
    case 'US':
      title = "Zelle (US)";
      details = [
        nombre,
        { icon: Mail, label: "Zelle (Email/Tel)", value: d.details.zelle_info },
      ];
      break;
    case 'EC':
      title = "Transferencia (EC)";
      details = [
        nombre,
        { icon: FileText, label: "Documento", value: d.details.documento },
        { icon: Landmark, label: "Banco", value: d.details.banco },
        { icon: Banknote, label: "N° Cuenta", value: d.details.cuenta },
      ];
      break;
    default:
      title = `Destinatario (${d.country})`;
      details = [nombre];
  }
  
  details = details.filter(Boolean); // Limpiar campos nulos (opcionales)

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-white text-lg flex items-center gap-2">
            {countryFlag} {apodo}
          </h4>
          <span className="text-xs font-medium bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">{title}</span>
        </div>
        {/* Botón de eliminar movido a la fila de acciones de abajo */}
      </div>
      <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
        {details.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <item.icon size={14} className="text-blue-400 shrink-0" />
            <span className="text-gray-400">{item.label}:</span>
            <span className="text-white font-medium truncate">{item.value}</span>
          </div>
        ))}
      </div>
      
      {/* --- NUEVA FILA DE ACCIONES --- */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
        <button 
          onClick={() => onSend(d)} // <-- MODIFICADO: Pasa el objeto 'd' completo
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
        >
          <ArrowRightLeft size={16} />
          Realizar Envío
        </button>
        <button onClick={() => onDelete(d.id)} title="Eliminar" className="bg-red-800 hover:bg-red-700 text-white p-2.5 rounded-lg transition-all active:scale-95">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}


// --- Componente Destinatarios (MODIFICADO) ---
function DestinatariosPage({ userId, getCountry, onSelectBeneficiary }) { // <-- AÑADIDO onSelectBeneficiary
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Estados del formulario dinámico
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  // Path privado para los datos del cliente
  const destinatariosCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'destinatarios');

  // Cargar destinatarios
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const q = query(destinatariosCollectionRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setDestinatarios(items);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar destinatarios: ", error);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Manejadores del formulario
  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setSelectedMethod(''); // Resetear método
    setFormData({}); // Resetear datos
    setFormError('');
  };

  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
    // Limpiar solo los campos específicos del método anterior
    const baseData = { apodo: formData.apodo, nombre: formData.nombre, apellido: formData.apellido };
    setFormData(baseData); 
    setFormError('');
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const resetForm = () => {
    setShowForm(false);
    setSelectedCountry('');
    setSelectedMethod('');
    setFormData({});
    setFormError('');
  };

  // --- NUEVA VALIDACIÓN ---
  const validateForm = () => {
    const { apodo, nombre, apellido } = formData;
    if (!selectedCountry) return "Debes seleccionar un país.";
    if (!apodo) return "Por favor ingresa un Apodo para este contacto.";
    if (!nombre) return "Por favor ingresa los Nombres.";
    if (!apellido) return "Por favor ingresa los Apellidos.";

    switch (selectedCountry) {
      case 'VE':
        const { cedula, banco, telefono } = formData;
        if (!cedula || !banco || !telefono) return "Completa todos los campos de Pago Móvil.";
        break;
      case 'CL':
        const { rut, banco: clBanco, tipoCuenta, cuenta, email } = formData;
        if (!rut || !clBanco || !tipoCuenta || !cuenta || !email) return "Completa todos los campos de Transferencia.";
        break;
      case 'PE':
        if (!selectedMethod) return "Selecciona un método para Perú (Transferencia, Yape o Plin).";
        if (selectedMethod === 'TRANSFERENCIA') {
          const { tipoDocumento, documento, cuenta } = formData;
          if (!tipoDocumento || !documento || !cuenta) return "Completa los campos de Transferencia (doc. y cuenta).";
        }
        if (selectedMethod === 'YAPE' || selectedMethod === 'PLIN') {
          if (!formData.telefono) return "Ingresa el número de Teléfono.";
        }
        break;
      case 'CO':
        if (!selectedMethod) return "Selecciona un método para Colombia (Nequi o Bancolombia).";
        if (selectedMethod === 'NEQUI') {
          if (!formData.telefono) return "Ingresa el número de Teléfono.";
        }
        if (selectedMethod === 'BANCOLOMBIA') {
          const { cedula: coCedula, tipoCuenta: coTipo, cuenta: coCuenta } = formData;
          if (!coCedula || !coTipo || !coCuenta) return "Completa todos los campos de Bancolombia.";
        }
        break;
      case 'BR':
        if (!formData.numero_pix) return "Ingresa el número de PIX.";
        break;
      case 'MX':
        const { banco: mxBanco, cuenta: mxCuenta, tipoCuenta: mxTipo } = formData;
        if (!mxBanco || !mxCuenta || !mxTipo) return "Completa todos los campos de Transferencia.";
        break;
      case 'US':
        if (!formData.zelle_info) return "Ingresa el Email o Teléfono de Zelle.";
        break;
      case 'EC':
        const { documento: ecDoc, banco: ecBanco, cuenta: ecCuenta } = formData;
        if (!ecDoc || !ecBanco || !ecCuenta) return "Completa todos los campos de Transferencia.";
        break;
      default:
        return "País no configurado.";
    }
    return null; // Sin errores
  };

  // Añadir destinatario
  const handleAdd = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(''); // Limpiar error si pasa validación

    try {
      let methodToSave = 'default';
      if (selectedCountry === 'VE') methodToSave = 'PAGO_MOVIL';
      else if (selectedCountry === 'CL') methodToSave = 'TRANSFERENCIA';
      else if (selectedCountry === 'PE') methodToSave = selectedMethod;
      else if (selectedCountry === 'CO') methodToSave = selectedMethod;
      else if (selectedCountry === 'BR') methodToSave = 'PIX';
      else if (selectedCountry === 'MX') methodToSave = 'TRANSFERENCIA';
      else if (selectedCountry === 'US') methodToSave = 'ZELLE';
      else if (selectedCountry === 'EC') methodToSave = 'TRANSFERENCIA';

      await addDoc(destinatariosCollectionRef, { 
        country: selectedCountry,
        method: methodToSave,
        details: formData // Guardamos todo el objeto de datos
      });
      resetForm(); // Ocultar y limpiar formulario
    } catch (error) {
      console.error("Error al añadir destinatario: ", error);
      setFormError("Error al guardar. Inténtalo de nuevo.");
    }
  };

  // Borrar destinatario
  const handleDelete = async (id) => {
    // TODO: Implementar un modal de confirmación.
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', userId, 'destinatarios', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error al borrar destinatario: ", error);
      // Idealmente, mostrar un error en la UI
    }
  };

  // Renderiza los campos del formulario dinámico
  const renderFormFields = () => {
    if (!selectedCountry) return null;

    // Campos base (Apodo y Nombre) que aparecen para todos
    const baseFields = (
      <>
        <div className="relative">
          <Edit2 size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input type="text" name="apodo" placeholder="* Apodo (Ej: Mi Mamá)" value={formData.apodo || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 pl-10 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" name="nombre" placeholder="* Nombres" value={formData.nombre || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          <input type="text" name="apellido" placeholder="* Apellidos" value={formData.apellido || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
        </div>
      </>
    );

    let specificFields = null;

    switch (selectedCountry) {
      case 'VE': // Venezuela: Pago Móvil
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: Pago Móvil</p>
            <input type="text" name="cedula" placeholder="* Número de Cédula" value={formData.cedula || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="banco" placeholder="* Nombre del Banco" value={formData.banco || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="telefono" placeholder="* Número de Teléfono" value={formData.telefono || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          </>
        );
        break;
      
      case 'CL': // Chile: Transferencia
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: Transferencia Bancaria</p>
            <input type="text" name="rut" placeholder="* Número de RUT" value={formData.rut || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="banco" placeholder="* Nombre del Banco" value={formData.banco || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            {/* --- CAMBIO: Select en vez de Input --- */}
            <div className="relative">
              <select name="tipoCuenta" value={formData.tipoCuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none appearance-none">
                <option value="">* Tipo de Cuenta</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Cuenta Vista">Cuenta Vista</option>
                <option value="Cuenta RUT">Cuenta RUT</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            <input type="text" name="cuenta" placeholder="* Número de Cuenta" value={formData.cuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="email" name="email" placeholder="* Correo Electrónico" value={formData.email || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          </>
        );
        break;

      case 'PE': // Perú: Selección de Método
        specificFields = (
          <>
            {/* --- CAMBIO: Tres opciones --- */}
            <div className="grid grid-cols-3 gap-2">
              <label className={`p-3 rounded-lg text-center text-sm cursor-pointer ${selectedMethod === 'TRANSFERENCIA' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                <input type="radio" name="method" value="TRANSFERENCIA" checked={selectedMethod === 'TRANSFERENCIA'} onChange={handleMethodChange} className="hidden" />
                Transferencia
              </label>
              <label className={`p-3 rounded-lg text-center text-sm cursor-pointer ${selectedMethod === 'YAPE' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                <input type="radio" name="method" value="YAPE" checked={selectedMethod === 'YAPE'} onChange={handleMethodChange} className="hidden" />
                Yape
              </label>
              <label className={`p-3 rounded-lg text-center text-sm cursor-pointer ${selectedMethod === 'PLIN' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                <input type="radio" name="method" value="PLIN" checked={selectedMethod === 'PLIN'} onChange={handleMethodChange} className="hidden" />
                Plin
              </label>
            </div>
            
            {selectedMethod === 'TRANSFERENCIA' && (
              <div className="space-y-3 pt-3 animate-in fade-in">
                {/* --- CAMBIO: Select de Documento --- */}
                <div className="relative">
                  <select name="tipoDocumento" value={formData.tipoDocumento || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none appearance-none">
                    <option value="">* Tipo de Documento</option>
                    <option value="DNI">DNI</option>
                    <option value="RUT">RUT</option>
                    <option value="CE">Carnet de Extranjería (CE)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                <input type="text" name="documento" placeholder="* Número de Documento" value={formData.documento || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
                <input type="text" name="cuenta" placeholder="* Número de Cuenta (BCP)" value={formData.cuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
                <input type="text" name="cci" placeholder="N° Cuenta Interbancaria (Opcional)" value={formData.cci || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              </div>
            )}
            
            {(selectedMethod === 'YAPE' || selectedMethod === 'PLIN') && (
              <div className="space-y-3 pt-3 animate-in fade-in">
                <input type="text" name="telefono" placeholder="* Número de Teléfono" value={formData.telefono || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              </div>
            )}
          </>
        );
        break;
      
      // --- NUEVOS FORMULARIOS ---
      case 'CO': // Colombia
        specificFields = (
          <>
            <div className="flex gap-2">
              <label className={`flex-1 p-3 rounded-lg text-center cursor-pointer ${selectedMethod === 'NEQUI' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                <input type="radio" name="method" value="NEQUI" checked={selectedMethod === 'NEQUI'} onChange={handleMethodChange} className="hidden" />
                Nequi
              </label>
              <label className={`flex-1 p-3 rounded-lg text-center cursor-pointer ${selectedMethod === 'BANCOLOMBIA' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                <input type="radio" name="method" value="BANCOLOMBIA" checked={selectedMethod === 'BANCOLOMBIA'} onChange={handleMethodChange} className="hidden" />
                Bancolombia
              </label>
            </div>
            
            {selectedMethod === 'NEQUI' && (
              <div className="space-y-3 pt-3 animate-in fade-in">
                <input type="text" name="telefono" placeholder="* Número de Teléfono" value={formData.telefono || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
                <input type="text" name="cedula" placeholder="Número de Cédula (Opcional)" value={formData.cedula || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              </div>
            )}
            
            {selectedMethod === 'BANCOLOMBIA' && (
              <div className="space-y-3 pt-3 animate-in fade-in">
                <input type="text" name="cedula" placeholder="* Número de Cédula" value={formData.cedula || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
                <input type="text" name="tipoCuenta" placeholder="* Tipo de Cuenta (Ahorros, Corriente)" value={formData.tipoCuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
                <input type="text" name="cuenta" placeholder="* Número de Cuenta" value={formData.cuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              </div>
            )}
          </>
        );
        break;

      case 'BR': // Brasil
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: PIX</p>
            <input type="text" name="numero_pix" placeholder="* Número de PIX (teléfono, email, CPF, etc.)" value={formData.numero_pix || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          </>
        );
        break;

      case 'MX': // México
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: Transferencia Bancaria</p>
            <input type="text" name="banco" placeholder="* Nombre del Banco" value={formData.banco || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="cuenta" placeholder="* Número de Cuenta (CLABE)" value={formData.cuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="tipoCuenta" placeholder="* Tipo de Cuenta" value={formData.tipoCuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-5G00 outline-none" />
          </>
        );
        break;

      case 'US': // Estados Unidos
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: Zelle</p>
            <input type="text" name="zelle_info" placeholder="* Teléfono o Email de Zelle" value={formData.zelle_info || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          </>
        );
        break;

      case 'EC': // Ecuador
        specificFields = (
          <>
            <p className="text-sm text-purple-300 font-medium -mb-1">Método: Transferencia Bancaria</p>
            <input type="text" name="documento" placeholder="* Número de Documento (Cédula/RUC)" value={formData.documento || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="banco" placeholder="* Nombre del Banco (Pichincha, Guayaquil, etc.)" value={formData.banco || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
            <input type="text" name="cuenta" placeholder="* Número de Cuenta" value={formData.cuenta || ''} onChange={handleFormChange} className="w-full bg-gray-700 p-2 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
          </>
        );
        break;

      default:
        specificFields = null;
    }

    return (
      <>
        {baseFields}
        <hr className="border-gray-700" />
        {specificFields}
      </>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {!showForm ? (
         <button 
           onClick={() => setShowForm(true)} 
           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
         >
          <Plus size={18} /> Añadir Nuevo Destinatario
        </button>
      ) : (
        <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-xl space-y-3 border-2 border-purple-700 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-lg">Nuevo Destinatario</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          {/* --- Formulario Dinámico --- */}
          <div className="relative">
            <select 
              value={selectedCountry} 
              onChange={handleCountryChange}
              className="w-full bg-gray-700 p-3 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none appearance-none"
            >
              <option value="">* Selecciona el País de Destino</option>
              {BENEFICIARY_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="space-y-3">
            {renderFormFields()}
          </div>
          {/* --- Fin Formulario Dinámico --- */}
          
          {formError && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm p-3 rounded-lg">
              {formError}
            </div>
          )}
          
          {selectedCountry && (
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Guardar Destinatario
            </button>
          )}
        </form>
      )}

      {/* Lista de Destinatarios */}
      <div className="space-y-3">
        <h3 className="font-bold text-white text-lg pt-4">Mis Destinatarios</h3>
        {loading && <p className="text-gray-400">Cargando...</p>}
        {!loading && destinatarios.length === 0 && (
          <p className="text-gray-400 text-sm p-4 bg-gray-800 rounded-lg text-center">No tienes destinatarios guardados.</p>
        )}
        {destinatarios.map(d => (
          <BeneficiaryCard 
            key={d.id} 
            d={d} 
            onDelete={handleDelete} 
            getCountry={getCountry} 
            onSend={onSelectBeneficiary} // <-- Pasamos la función
          />
        ))}
      </div>
    </div>
  );
}

// --- Componente Historial (NUEVO) ---
function HistorialPage() {
  return (
    <div className="p-4">
      <div className="text-center py-16 bg-gray-800 rounded-xl border border-dashed border-purple-700">
        <History size={40} className="mx-auto text-purple-400 mb-4" />
        <h3 className="font-bold text-white text-lg">Historial de Envíos</h3>
        <p className="text-gray-400 text-sm mt-2">Próximamente...</p>
        <p className="text-gray-500 text-xs mt-1">Aquí podrás ver un registro de todas tus transacciones.</p>
      </div>
    </div>
  );
}

// --- Componente Calculadora (Refactorizado) ---
function CalculadoraPage({ 
  routes, amount, setAmount, selectedFrom, setSelectedFrom, selectedTo, setSelectedTo, 
  lastUpdated, dbSource, getCountry, formatTime, handleSwap, currentRoute, result,
  user, selectedDestinatario // <-- NUEVOS PROPS
}) {

  // --- NUEVA FUNCIÓN ---
  // Genera el mensaje de WhatsApp dinámicamente
  const handleGenerarMensajeWhatsApp = () => {
    const paisDesde = getCountry(selectedFrom)?.name;
    const paisA = getCountry(selectedTo)?.name;
    const montoEnviado = amount || "0.00";
    const monedaEnviada = getCountry(selectedFrom)?.currency;
    const montoRecibido = result || "0.00"; // El 'result' ya viene formateado
    const monedaRecibida = getCountry(selectedTo)?.currency;

    let mensaje = `Hola, quiero realizar un envío de ${paisDesde} a ${paisA}.\n\n`;
    mensaje += `*Monto a enviar:* ${montoEnviado} ${monedaEnviada}\n`;
    
    // --- Lógica de Destinatario ---
    if (user && selectedDestinatario && selectedDestinatario.country === selectedTo) {
      mensaje += `\n*Datos del Destinatario (Guardado)*\n`;
      const d = selectedDestinatario;
      const nombreCompleto = `${d.details.nombre} ${d.details.apellido}`.trim();
      mensaje += `Apodo: ${d.details.apodo}\n`;
      mensaje += `Nombre: ${nombreCompleto}\n`;

      switch(d.country) {
        case 'VE':
          mensaje += `Cédula: ${d.details.cedula}\nBanco: ${d.details.banco}\nTeléfono: ${d.details.telefono}\n`;
          break;
        case 'CL':
          mensaje += `RUT: ${d.details.rut}\nBanco: ${d.details.banco}\nTipo Cuenta: ${d.details.tipoCuenta}\nN° Cuenta: ${d.details.cuenta}\nEmail: ${d.details.email}\n`;
          break;
        case 'PE':
          mensaje += `Método: ${d.method}\n`;
          if (d.method === 'TRANSFERENCIA') {
            mensaje += `Documento: ${d.details.tipoDocumento} ${d.details.documento}\nN° Cuenta: ${d.details.cuenta}\n`;
            if (d.details.cci) mensaje += `CCI: ${d.details.cci}\n`;
          } else { // Yape/Plin
            mensaje += `Teléfono: ${d.details.telefono}\n`;
          }
          break;
        case 'CO':
          mensaje += `Método: ${d.method}\n`;
          if (d.method === 'NEQUI') {
            mensaje += `Teléfono: ${d.details.telefono}\n`;
            if (d.details.cedula) mensaje += `Cédula (Opcional): ${d.details.cedula}\n`;
          } else { // Bancolombia
            mensaje += `Cédula: ${d.details.cedula}\nTipo Cuenta: ${d.details.tipoCuenta}\nN° Cuenta: ${d.details.cuenta}\n`;
          }
          break;
        case 'BR':
          mensaje += `Método: PIX\nPIX: ${d.details.numero_pix}\n`;
          break;
        case 'MX':
          mensaje += `Banco: ${d.details.banco}\nN° Cuenta (CLABE): ${d.details.cuenta}\nTipo Cuenta: ${d.details.tipoCuenta}\n`;
          break;
        case 'US':
          mensaje += `Método: Zelle\nZelle: ${d.details.zelle_info}\n`;
          break;
        case 'EC':
          mensaje += `Documento: ${d.details.documento}\nBanco: ${d.details.banco}\nN° Cuenta: ${d.details.cuenta}\n`;
          break;
        default:
          mensaje += `(Datos varios: ${JSON.stringify(d.details)})\n`;
      }
    } else {
      // Mensaje simple (como antes) si no hay destinatario seleccionado
      mensaje += `(Por favor, confírmame los datos del destinatario)\n`;
    }
    // --- FIN LÓGICA ---

    // El monto ya viene con comas, pero WhatsApp no soporta negrita con comas.
    // Lo enviamos simple. El formato es para la App.
    // Para WhatsApp, usamos el número sin formato.
    const montoRecibidoNum = (parseFloat(amount || 0) * (currentRoute?.rate || 0)).toFixed(2);
    
    mensaje += `\n*Monto a recibir (aprox): ${montoRecibidoNum} ${monedaRecibida}*`;


    const encodedMensaje = encodeURIComponent(mensaje);
    window.open(`https://wa.me/51955555497?text=${encodedMensaje}`, '_blank');
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-purple-900">
      <div className="bg-gray-800 p-3 border-b border-purple-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-blue-400" /> 
          <h2 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Cotizador al Instante</h2>
        </div>
        {dbSource === 'live' ? (
          <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-2 py-1 rounded-full border border-green-800/50">
            <Wifi size={10} />
            <span>En Vivo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-900/20 px-2 py-1 rounded-full border border-amber-800/50">
            <WifiOff size={10} />
            <span>Offline</span>
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-6">
        {/* Selectores */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Envías Desde</label>
            <div className="relative">
              <select 
                value={selectedFrom}
                onChange={(e) => setSelectedFrom(e.target.value)}
                className="w-full py-2 bg-transparent border-b-2 border-purple-700 text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} className="bg-gray-800 text-white">{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSwap} 
            title="Invertir países"
            className="bg-purple-800/50 p-2 rounded-full text-blue-300 shadow-inner shadow-purple-900 transition-all hover:bg-purple-700/80 active:scale-90 cursor-pointer"
          >
            <ArrowRightLeft size={16} />
          </button>

          <div className="flex flex-col space-y-1 text-right">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reciben En</label>
            <div className="relative">
              <select 
                value={selectedTo}
                onChange={(e) => setSelectedTo(e.target.value)}
                className="w-full py-2 bg-transparent border-b-2 border-purple-700 text-white font-bold focus:outline-none focus:border-blue-500 text-right cursor-pointer"
                style={{direction: 'rtl'}}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} className="bg-gray-800 text-white">{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* --- NUEVO: Indicador de Destinatario --- */}
        {user && selectedDestinatario && selectedDestinatario.country === selectedTo && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
            <UserCheck size={16} />
            Enviando a: <strong className="text-white">{selectedDestinatario.details.apodo}</strong>
          </div>
        )}

        {/* Monto */}
        <div className="bg-purple-900/40 rounded-xl p-4 border border-purple-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all group">
          <label className="text-xs font-bold text-purple-300 block mb-1">MONTO ({getCountry(selectedFrom)?.currency})</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100.00"
            className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-500 outline-none"
          />
        </div>

        {/* Resultado */}
        {currentRoute ? (
          <div className="text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-center items-center text-xs text-gray-400 mb-3">
              <span className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-1 border border-purple-800 shadow-inner shadow-black/20">
                Tasa: 1 {getCountry(selectedFrom)?.currency} = 
                <span className="font-bold text-blue-300">{currentRoute.rate}</span> 
                {getCountry(selectedTo)?.currency}
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden border border-blue-700">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-blue-500/30 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>
              
              <p className="text-sm text-gray-400 mb-1">Reciben (aprox):</p>
              <div className="text-4xl font-bold tracking-tight flex items-baseline justify-center gap-2 text-blue-300">
                {result} {/* <-- AHORA SE MUESTRA FORMATEADO (9,338.00) */}
                <span className="text-lg text-purple-400 font-medium">{getCountry(selectedTo)?.currency}</span>
              </div>
            </div>

            <button 
              onClick={handleGenerarMensajeWhatsApp} // <-- Llama a la nueva función
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Phone size={20} /> 
              <span>Solicitar Cambio por WhatsApp</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-xl border border-dashed border-purple-700">
            <p className="text-gray-400 font-medium">Ruta no disponible</p>
            <p className="text-xs text-gray-500 mt-1">Esta ruta no está configurada aún</p>
          </div>
        )}
        
        {/* Info status footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-800 text-[10px] text-gray-500">
           <div className="flex items-center gap-1">
             <CloudCog size={10} /> Base de Datos v5 (Producción)
           </div>
           {lastUpdated && <div>Última act: {formatTime(lastUpdated)}</div>}
        </div>
      </div>
    </div>
  );
}


// --- Componente Principal de la App ---
export default function App() {
  // --- Estados Globales ---
  const [routes, setRoutes] = useState(MASTER_ROUTES); 
  const [adminRoutes, setAdminRoutes] = useState(MASTER_ROUTES);
  const [amount, setAmount] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dbSource, setDbSource] = useState('conectando...');
  
  // --- Estados de UI ---
  const [selectedFrom, setSelectedFrom] = useState('PE');
  const [selectedTo, setSelectedTo] = useState('VE');
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS NUEVOS: Navegación y Auth de Clientes ---
  const [page, setPage] = useState('calculadora'); // 'calculadora', 'login', 'register', 'dashboard'
  const [dashboardPage, setDashboardPage] = useState('destinatarios'); // 'destinatarios', 'historial'
  const [user, setUser] = useState(null); // Objeto de usuario de Firebase
  const [userId, setUserId] = useState(null); // UID del usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // --- NUEVO ESTADO: Destinatario Seleccionado ---
  const [selectedDestinatario, setSelectedDestinatario] = useState(null);

  // --- Estados de Admin (PIN) ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Configuración DB
  const COLLECTION_NAME = "routes_data";
  const DOC_ID = "exchange_routes_v5_production"; 

  // --- Lógica de Fusión ---
  const mergeRoutes = (savedRoutes) => {
    if (!savedRoutes || savedRoutes.length === 0) return MASTER_ROUTES;
    const merged = [...MASTER_ROUTES];
    savedRoutes.forEach(savedRoute => {
      const index = merged.findIndex(r => r.id === savedRoute.id);
      if (index !== -1) {
        merged[index] = savedRoute; // Sobrescribir con datos guardados
      }
    });
    // Añadir rutas maestras que no estén en la DB
    MASTER_ROUTES.forEach(masterRoute => {
      if (!merged.find(r => r.id === masterRoute.id)) {
        merged.push(masterRoute);
      }
    });
    return merged;
  };

  // --- 1. Carga de Datos PÚBLICOS (Tasas) y Auth ---
  useEffect(() => {
    let unsubData = () => {};
    let isMounted = true;

    // Listener de Autenticación (Admin Anónimo y Clientes)
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) {
        if (currentUser) {
          // Si el usuario es anónimo, NO es un cliente logueado
          if (currentUser.isAnonymous) {
            setUser(null); // Lo tratamos como "no logueado"
            setUserId(null);
          } else {
             // Solo si NO es anónimo, es un cliente real
            setUser(currentUser);
            setUserId(currentUser.uid);
          }
        } else {
          setUser(null);
          setUserId(null);
        }
      }
    });

    // Carga inicial de datos anónimos Y LUEGO carga de datos públicos
    const signInAndLoadData = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          // await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Solo iniciar anónimamente si no hay un usuario ya logueado
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        }
        
        // ***** FIX: MOVER EL LISTENER AQUÍ *****
        // Ahora que estamos autenticados (al menos anónimamente), cargamos las tasas.
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, DOC_ID);
        unsubData = onSnapshot(docRef, (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const data = snap.data();
            const fullRoutes = mergeRoutes(data.routes);
            setRoutes(fullRoutes);
            setDbSource('live');
            if (!isAdmin) setAdminRoutes(fullRoutes);
            if (data.lastUpdated) setLastUpdated(data.lastUpdated);
          } else {
            const now = new Date().toISOString();
            setDbSource('creating');
            setDoc(docRef, { routes: MASTER_ROUTES, lastUpdated: now })
               .then(() => setDbSource('live'))
               .catch(e => console.log("Error creando init doc", e));
            setRoutes(MASTER_ROUTES);
            setAdminRoutes(MASTER_ROUTES);
            setLastUpdated(now);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error cargando datos:", error); // <-- El error debería estar resuelto ahora
          if (isMounted) {
            setDbSource('offline');
            setRoutes(MASTER_ROUTES);
            if(!isAdmin) setAdminRoutes(MASTER_ROUTES);
            setLoading(false);
          }
        });
        // ***** FIN DEL BLOQUE MOVIDO *****

      } catch (error) {
        console.error("Error Auth:", error);
        if (isMounted) {
          setDbSource('error-auth');
          setLoading(false);
        }
      }
    };
    
    signInAndLoadData(); // Llamar a la función unificada

    return () => {
      isMounted = false;
      unsubAuth();
      unsubData();
    };
  }, [isAdmin]);

  // --- NUEVO EFFECT: Limpiar destinatario si el país "Para" cambia ---
  useEffect(() => {
    // Si el destinatario seleccionado no coincide con el país de destino,
    // lo des-seleccionamos.
    if (selectedDestinatario && selectedTo !== selectedDestinatario.country) {
      setSelectedDestinatario(null);
    }
  }, [selectedTo, selectedDestinatario]);


  // --- Lógica de Negocio (Calculadora) ---
  const currentRoute = useMemo(() => {
    return routes.find(r => r.from === selectedFrom && r.to === selectedTo);
  }, [routes, selectedFrom, selectedTo]);

  // --- MODIFICADO: Lógica de formato ---
  const result = useMemo(() => {
    if (!amount || !currentRoute) return "---";
    
    const rateNum = parseFloat(currentRoute.rate);
    const amountNum = parseFloat(amount);
    
    if (isNaN(rateNum) || isNaN(amountNum)) return "---";
    
    const calculation = amountNum * rateNum;
    
    // NUEVO FORMATEADOR: 'en-US' usa (,) para miles y (.) para decimales
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(calculation);
    
  }, [amount, currentRoute]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options);
  };

  const getCountry = (code) => COUNTRIES.find(c => c.code === code) || { flag: '🌐', name: code, currency: '???' };

  const handleSwap = () => {
    const oldFrom = selectedFrom;
    const oldTo = selectedTo;
    setSelectedFrom(oldTo);
    setSelectedTo(oldFrom);
    // Al hacer swap, también limpiamos el destinatario seleccionado
    setSelectedDestinatario(null); 
  };

  // --- Funciones Admin (PIN) ---
  const handleAdminLogin = () => {
    if (pin === '1234') { // Este es tu PIN de admin
      setIsAdmin(true);
      setShowPin(false);
      setPin('');
      setSaveSuccess(false);
      setAdminRoutes([...routes]); 
    } else {
      const input = document.getElementById('pin-input');
      if(input) {
        input.style.borderColor = 'red';
        setTimeout(() => input.style.borderColor = '', 1000);
      }
    }
  };

  const handleLocalRateChange = (routeId, newValue) => {
    setSaveSuccess(false); 
    setAdminRoutes(prev => prev.map(r => 
      r.id === routeId ? { ...r, rate: newValue } : r
    ));
  };

  const saveToDatabase = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const routesToSave = adminRoutes.map(r => {
        let rateString = String(r.rate);
        rateString = rateString.replace(',', '.');
        const finalRate = parseFloat(rateString);
        return { ...r, rate: isNaN(finalRate) ? 0 : finalRate };
      });
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, DOC_ID);
      await setDoc(docRef, { routes: routesToSave, lastUpdated: now });
      setLastUpdated(now); 
      setRoutes(routesToSave); 
      setAdminRoutes(routesToSave); 
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Error guardando:", e);
      // Idealmente, mostrar un error en la UI
    } finally {
      setSaving(false);
    }
  };

  // --- Funciones Cliente (Email/Pass) (NUEVO) ---
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPage('dashboard'); // Redirige al dashboard
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError("Email o contraseña incorrectos.");
      console.error("Error login cliente:", error);
    }
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (password.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setPage('dashboard'); // Redirige al dashboard
      setEmail('');
      setPassword('');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("Este email ya está registrado.");
      } else {
        setAuthError("Error al registrar la cuenta.");
      }
      console.error("Error registro cliente:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserId(null);
    setPage('calculadora'); // Vuelve a la calculadora pública
    setSelectedDestinatario(null); // Limpiar destinatario al salir
    // Re-autenticar anónimamente para seguir viendo las tasas
    signInAnonymously(auth).catch(e => console.error("Auth error", e));
  };

  // --- NUEVA FUNCIÓN ---
  // Se llama cuando el usuario hace clic en "Realizar Envío" en una tarjeta de destinatario
  const handleSelectBeneficiary = (destinatario) => {
    setPage('calculadora'); // Ir a la calculadora
    setSelectedTo(destinatario.country); // Pre-seleccionar el país de destino
    setSelectedDestinatario(destinatario); // Pre-seleccionar el contacto
  };


  // --- Renderizado ---
  if (loading && page === 'calculadora' && !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1b0042] to-[#0a0020] text-purple-300">
      <RotateCw className="animate-spin mb-2" size={32}/>
      <span className="font-medium">Conectando con el servidor...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b0042] to-[#0a0020] font-sans text-white pb-20">
      
      {/* --- Header --- */}
      <header className="bg-gradient-to-r from-[#2a0050] to-[#1a0030] text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#5c00b3]/30 p-2 rounded-lg backdrop-blur-sm shadow-md">
              <Globe size={20} className="text-[#a070ff]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight text-[#f0f0ff]">Cripto Cambios</h1>
              <span className="text-xs text-[#a070ff] font-medium flex items-center gap-1.5 mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div> 
                 Luxury Trade
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón Admin (PIN) */}
            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setShowPin(!showPin)} 
              className={`p-2 rounded-full transition-all ${isAdmin ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/10'}`}
            >
              {isAdmin ? <Lock size={20} /> : <Lock size={20} className="opacity-70 text-purple-200"/>}
            </button>
            {/* Botón Cliente (NUEVO) */}
            <button 
              onClick={() => {
                if (user) {
                  setPage('dashboard'); // Si está logueado, va al dashboard
                  setDashboardPage('destinatarios'); // Reset a la pestaña principal
                } else {
                  setPage('login'); // Si no, va al login
                }
              }} 
              className={`p-2 rounded-full transition-all ${user ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10'}`}
            >
              <User size={20} className={user ? '' : 'opacity-70 text-purple-200'}/>
            </button>
          </div>
        </div>
      </header>

      {/* --- Modal PIN (Admin) --- */}
      {showPin && !isAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center border border-purple-700">
            <div className="bg-purple-800/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-700">
              <Lock className="text-purple-400" size={24}/>
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Acceso Administrador</h3>
            <p className="text-xs text-gray-400 mb-4">Ingresa tu PIN para editar las tasas</p>
            <div className="flex gap-2">
              <input 
                id="pin-input"
                type="password" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="flex-1 bg-gray-700 border-2 border-transparent px-4 py-2 rounded-xl text-center font-bold text-xl outline-none focus:border-purple-500 focus:bg-gray-900 text-white transition-all"
                placeholder="••••"
                autoFocus
              />
              <button onClick={handleAdminLogin} className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl font-bold transition-colors">
                ➜
              </button>
            </div>
            <button onClick={() => setShowPin(false)} className="mt-4 text-xs text-gray-400 hover:text-white">Cancelar</button>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-6 mt-2">
        {/* --- RENDERIZADO CONDICIONAL DE PÁGINA --- */}
        
        {page === 'calculadora' && (
          <CalculadoraPage 
            routes={routes}
            amount={amount}
            setAmount={setAmount}
            selectedFrom={selectedFrom}
            setSelectedFrom={setSelectedFrom}
            selectedTo={selectedTo}
            setSelectedTo={setSelectedTo}
            lastUpdated={lastUpdated}
            dbSource={dbSource}
            getCountry={getCountry}
            formatTime={formatTime}
            handleSwap={handleSwap}
            currentRoute={currentRoute}
            result={result}
            user={user} // <-- Pasa el usuario
            selectedDestinatario={selectedDestinatario} // <-- Pasa el destinatario
          />
        )}

        {page === 'login' && (
          <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-purple-900 animate-in fade-in">
            <button onClick={() => setPage('calculadora')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4">
              <ArrowLeft size={16} /> Volver a la calculadora
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Acceso Clientes</h2>
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-700 p-3 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-700 p-3 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Iniciar Sesión</button>
              <p className="text-center text-gray-400 text-sm">
                ¿No tienes cuenta? <button type="button" onClick={() => setPage('register')} className="text-blue-400 hover:underline font-medium">Regístrate aquí</button>
              </p>
            </form>
          </div>
        )}

        {page === 'register' && (
          <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-purple-900 animate-in fade-in">
            <button onClick={() => setPage('login')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4">
              <ArrowLeft size={16} /> Volver al login
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Crear Cuenta</h2>
            <form onSubmit={handleCustomerRegister} className="space-y-4">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-700 p-3 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-700 p-3 rounded-lg text-white border border-transparent focus:border-blue-500 outline-none" />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Crear Cuenta</button>
            </form>
          </div>
        )}
        
        {page === 'dashboard' && user && (
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-purple-900 animate-in fade-in">
            <div className="p-4 border-b border-purple-900">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-white">Hola, Cliente</h2>
                <button onClick={handleLogout} className="text-xs bg-gray-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                  <LogOut size={14} /> Salir
                </button>
              </div>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            {/* Pestañas del Dashboard */}
            <div className="flex bg-gray-800">
              <button 
                onClick={() => setDashboardPage('destinatarios')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${dashboardPage === 'destinatarios' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <Users size={16} /> Destinatarios
              </button>
              <button 
                onClick={() => setDashboardPage('historial')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${dashboardPage === 'historial' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <History size={16} /> Historial
              </button>
               <button 
                onClick={() => {
                  setPage('calculadora');
                  setSelectedDestinatario(null); // Limpiar destinatario al ir a la calc
                }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-700`}
              >
                <Search size={16} /> Calculadora
              </button>
            </div>
            
            {/* Contenido de las pestañas */}
            {dashboardPage === 'destinatarios' && (
              <DestinatariosPage 
                userId={userId} 
                getCountry={getCountry} 
                onSelectBeneficiary={handleSelectBeneficiary} // <-- AÑADIDO
              />
            )}
            {dashboardPage === 'historial' && <HistorialPage />}
          </div>
        )}

        {/* --- ADMIN PANEL (Sin cambios) --- */}
        {isAdmin && (
          <div className="bg-gray-900 border-2 border-indigo-500 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 relative overflow-hidden">
             {/* Header Panel */}
            <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white p-4 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2">
                 <Save size={20} /> Editor de Tasas
               </h3>
               <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold bg-green-500/30 text-green-300 px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
                       <CheckCircle2 size={12}/> Guardado
                    </span>
                  )}
                  <button 
                    onClick={() => setIsAdmin(false)} 
                    className="text-xs bg-indigo-700 hover:bg-indigo-800 px-3 py-1 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
               </div>
            </div>

            <div className="p-4">
              <div className="bg-purple-900/40 text-purple-200 p-3 rounded-lg text-xs mb-4 flex gap-2 items-start border border-purple-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-300"/>
                <p>Recuerda: Después de cambiar un número, DEBES presionar el botón "GUARDAR CAMBIOS" para que los clientes lo vean.</p>
              </div>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {adminRoutes.map((route) => {
                  const cFrom = getCountry(route.from);
                  const cTo = getCountry(route.to);
                  if (!cFrom || !cTo) return null;

                  return (
                    <div key={route.id} className="bg-gray-800 p-2 rounded-lg border border-purple-800 flex items-center justify-between hover:border-indigo-500 transition-colors shadow-inner shadow-black/20">
                      <div className="flex items-center gap-3">
                         <div className="flex -space-x-1 text-lg opacity-90">
                            <span>{cFrom.flag}</span>
                            <span>{cTo.flag}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-200 text-xs">{cFrom.name} ➜ {cTo.name}</span>
                         </div>
                      </div>
                      <input 
                        type="text" 
                        value={route.rate}
                        onChange={(e) => handleLocalRateChange(route.id, e.target.value)}
                        className="w-24 bg-gray-700 border border-purple-700 rounded px-2 py-1 text-right font-bold text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none"
                        inputMode="decimal"
                      />
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={saveToDatabase}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-4
                  ${saving 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : saveSuccess 
                      ? 'bg-green-600 text-white scale-95 shadow-green-900/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-95 shadow-blue-900/50'
                  }`}
              >
                {saving ? (
                  <> <RotateCw className="animate-spin"/> Guardando... </>
                ) : saveSuccess ? (
                   <> <CheckCircle2/> ¡Tasas Actualizadas! </>
                ) : (
                   <> <Save/> GUARDAR CAMBIOS </>
                )}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

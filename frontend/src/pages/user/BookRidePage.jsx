import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Car, Clock, DollarSign, ChevronRight, ArrowRight, Bike, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import MapView from '../../components/map/MapView';
import { rideService } from '../../services/api';

const RIDE_TYPES = [
  { type: 'bike', icon: Bike, label: 'Bike', capacity: '1 seat', eta: '3 min' },
  { type: 'auto', icon: Car, label: 'Auto', capacity: '3 seats', eta: '5 min' },
  { type: 'economy', icon: Car, label: 'Economy', capacity: '4 seats', eta: '6 min' },
  { type: 'standard', icon: Car, label: 'Standard', capacity: '4 seats', eta: '5 min' },
  { type: 'premium', icon: Car, label: 'Premium', capacity: '4 seats', eta: '8 min' },
  { type: 'xl', icon: Truck, label: 'XL', capacity: '6 seats', eta: '10 min' },
];

// Geocode using Nominatim (free OpenStreetMap geocoder)
const geocodeAddress = async (address) => {
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=in`);
    const data = await resp.json();
    return data.map(r => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
  } catch {
    return [];
  }
};

// Haversine distance
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function BookRidePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=locations, 2=vehicle, 3=confirm
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null });
  const [suggestions, setSuggestions] = useState({ pickup: [], destination: [] });
  const [activeInput, setActiveInput] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [selectedType, setSelectedType] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Debounced geocode
  useEffect(() => {
    if (!activeInput) return;
    const val = activeInput === 'pickup' ? pickup.address : destination.address;
    if (val.length < 3) { setSuggestions(prev => ({ ...prev, [activeInput]: [] })); return; }
    const timer = setTimeout(async () => {
      const results = await geocodeAddress(val);
      setSuggestions(prev => ({ ...prev, [activeInput]: results.slice(0, 4) }));
    }, 400);
    return () => clearTimeout(timer);
  }, [pickup.address, destination.address, activeInput]);

  const selectSuggestion = (type, suggestion) => {
    const shortAddr = suggestion.label.split(',').slice(0, 2).join(',');
    if (type === 'pickup') setPickup({ address: shortAddr, lat: suggestion.lat, lng: suggestion.lng });
    else setDestination({ address: shortAddr, lat: suggestion.lat, lng: suggestion.lng });
    setSuggestions(prev => ({ ...prev, [type]: [] }));
    setActiveInput(null);
  };

  const handleGetEstimates = async () => {
    if (!pickup.lat || !destination.lat) { toast.error('Please select valid pickup and destination'); return; }
    setSearching(true);
    const dist = calcDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const dur = (dist / 8.33) + 300; // ~30 km/h + 5 min
    try {
      const { data } = await rideService.estimate({ distance: dist, duration: dur });
      setEstimates(data.estimates);
      setStep(2);
    } catch {
      toast.error('Failed to get estimates');
    } finally { setSearching(false); }
  };

  const handleBookRide = async () => {
    setLoading(true);
    const dist = calcDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const dur = (dist / 8.33) + 300;
    try {
      const { data } = await rideService.book({
        pickup: { address: pickup.address, coordinates: { lat: pickup.lat, lng: pickup.lng } },
        destination: { address: destination.address, coordinates: { lat: destination.lat, lng: destination.lng } },
        rideType: selectedType,
        paymentMethod,
        distance: dist,
        duration: dur
      });
      toast.success('Ride booked! Searching for drivers...');
      navigate(`/ride/${data.ride._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  const selectedFare = estimates.find(e => e.type === selectedType);
  const distKm = pickup.lat && destination.lat
    ? (calcDistance(pickup.lat, pickup.lng, destination.lat, destination.lng) / 1000).toFixed(1)
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* Left Panel */}
      <div className="w-full lg:w-96 bg-white border-r border-surface-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-100">
          <h1 className="font-display font-bold text-xl text-surface-900 mb-1">Book a Ride</h1>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-500' : 'bg-surface-200'}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Locations */}
          {step >= 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wider">Locations</h3>

              {/* Pickup */}
              <div className="relative">
                <div className="absolute left-4 top-3.5 w-3 h-3 bg-emerald-500 rounded-full" />
                <input
                  type="text"
                  placeholder="Pickup location"
                  value={pickup.address}
                  onChange={e => { setPickup(p => ({ ...p, address: e.target.value, lat: null, lng: null })); setActiveInput('pickup'); }}
                  onFocus={() => setActiveInput('pickup')}
                  className="input-field pl-10"
                />
                {suggestions.pickup.length > 0 && activeInput === 'pickup' && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-surface-200 rounded-2xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.pickup.map((s, i) => (
                      <button key={i} onClick={() => selectSuggestion('pickup', s)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-start gap-3 text-sm border-b border-surface-100 last:border-0">
                        <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-surface-700 line-clamp-2">{s.label.split(',').slice(0, 3).join(', ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vertical connector */}
              <div className="flex items-center gap-3 px-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-4 bg-surface-300" />
                </div>
              </div>

              {/* Destination */}
              <div className="relative">
                <div className="absolute left-4 top-3.5 w-3 h-3 bg-red-500 rounded-full" />
                <input
                  type="text"
                  placeholder="Where to?"
                  value={destination.address}
                  onChange={e => { setDestination(d => ({ ...d, address: e.target.value, lat: null, lng: null })); setActiveInput('destination'); }}
                  onFocus={() => setActiveInput('destination')}
                  className="input-field pl-10"
                />
                {suggestions.destination.length > 0 && activeInput === 'destination' && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-surface-200 rounded-2xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.destination.map((s, i) => (
                      <button key={i} onClick={() => selectSuggestion('destination', s)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-start gap-3 text-sm border-b border-surface-100 last:border-0">
                        <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-surface-700 line-clamp-2">{s.label.split(',').slice(0, 3).join(', ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {distKm && (
                <div className="flex gap-3 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Navigation size={12} />{distKm} km</span>
                  <span className="flex items-center gap-1"><Clock size={12} />~{Math.round(parseFloat(distKm) / 25 * 60)} min</span>
                </div>
              )}

              {step === 1 && (
                <button
                  onClick={handleGetEstimates}
                  disabled={!pickup.lat || !destination.lat || searching}
                  className="btn-primary w-full"
                >
                  {searching ? <span className="loading-dots"><span /><span /><span /></span> : <>See Prices <ArrowRight size={16} /></>}
                </button>
              )}
            </div>
          )}

          {/* Step 2: Vehicle selection */}
          {step >= 2 && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wider">Choose Vehicle</h3>
                <button onClick={() => setStep(1)} className="text-xs text-brand-500 font-medium">Change</button>
              </div>
              <div className="space-y-2">
                {estimates.map(({ type, fare }) => {
                  const rideInfo = RIDE_TYPES.find(r => r.type === type);
                  const Icon = rideInfo?.icon || Car;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                        selectedType === type ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-surface-300 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedType === type ? 'bg-brand-500' : 'bg-surface-100'}`}>
                        <Icon size={18} className={selectedType === type ? 'text-white' : 'text-surface-500'} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-surface-900 text-sm">{rideInfo?.label || type}</span>
                          <span className="text-xs text-surface-400">{rideInfo?.capacity}</span>
                        </div>
                        <span className="text-xs text-surface-400">{rideInfo?.eta} away</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-surface-900">₹{fare.total}</p>
                        <p className="text-xs text-surface-400">{distKm} km</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payment method */}
              <div>
                <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wider mb-2">Payment</h3>
                <div className="flex gap-2">
                  {['cash', 'wallet', 'upi'].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        paymentMethod === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(3)} className="btn-primary w-full">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && selectedFare && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-surface-800 text-sm uppercase tracking-wider">Confirm Ride</h3>
                <button onClick={() => setStep(2)} className="text-xs text-brand-500 font-medium">Change</button>
              </div>
              <div className="card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <div><p className="text-xs text-surface-400">Pickup</p><p className="font-medium text-surface-900 text-sm">{pickup.address}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-red-500 rounded-full flex-shrink-0" />
                  <div><p className="text-xs text-surface-400">Drop</p><p className="font-medium text-surface-900 text-sm">{destination.address}</p></div>
                </div>
              </div>
              <div className="card p-4 space-y-2">
                {[
                  ['Base Fare', `₹${selectedFare.fare.baseFare}`],
                  ['Distance', `₹${selectedFare.fare.distanceFare}`],
                  ['Time', `₹${selectedFare.fare.timeFare}`],
                  ['Tax', `₹${selectedFare.fare.tax}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-surface-500">{k}</span>
                    <span className="text-surface-700">{v}</span>
                  </div>
                ))}
                <div className="border-t border-surface-200 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-brand-600 text-lg">₹{selectedFare.fare.total}</span>
                </div>
              </div>
              <button onClick={handleBookRide} disabled={loading} className="btn-primary w-full">
                {loading ? <span className="loading-dots"><span /><span /><span /></span> : <>Confirm Booking — ₹{selectedFare.fare.total}</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-64 lg:h-auto">
        <MapView
          pickup={pickup.lat ? pickup : null}
          destination={destination.lat ? destination : null}
          height="100%"
          className="h-full rounded-none lg:rounded-none"
        />
      </div>
    </div>
  );
}

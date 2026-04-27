import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, IndianRupee, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import MapView from '../../components/map/MapView';
import { carpoolService } from '../../services/api';

// Geocode using OpenRouteService
const geocodeAddress = async (address) => {
  try {
    const resp = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${import.meta.env.VITE_ORS_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=IN&size=5`);
    const data = await resp.json();
    return data.features.map(f => ({
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    }));
  } catch {
    return [];
  }
};

export default function PostRidePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null });
  const [suggestions, setSuggestions] = useState({ pickup: [], destination: [] });
  const [activeInput, setActiveInput] = useState(null);

  const [formData, setFormData] = useState({
    departureDate: '',
    departureTime: '',
    totalSeats: 1,
    costPerSeat: ''
  });

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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup.lat || !destination.lat) {
      toast.error('Please select valid pickup and destination locations');
      return;
    }
    setLoading(true);
    try {
      if (formData.totalSeats < 1) {
        toast.error('Available seats must be at least 1');
        setLoading(false);
        return;
      }
      
      const payload = {
        ...formData,
        startingLocation: pickup.address,
        destination: destination.address,
      };

      await carpoolService.postRide(payload);
      toast.success('Ride posted successfully!');
      navigate('/driver'); // Navigate to Driver Dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      {/* Left Panel */}
      <div className="w-full lg:w-[400px] bg-white border-r border-surface-100 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-surface-100">
          <h1 className="font-display font-bold text-xl text-surface-900">Post a Ride</h1>
          <p className="text-surface-500 text-sm mt-1">Offer a ride and share travel costs.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Route Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Starting Location</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-brand-500" />
                <input
                  type="text"
                  placeholder="e.g., KPHB, Hyderabad"
                  value={pickup.address}
                  onChange={e => { setPickup(p => ({ ...p, address: e.target.value, lat: null, lng: null })); setActiveInput('pickup'); }}
                  onFocus={() => setActiveInput('pickup')}
                  className="input-field pl-10 w-full"
                  required
                />
                {suggestions.pickup.length > 0 && activeInput === 'pickup' && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-surface-200 rounded-2xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.pickup.map((s, i) => (
                      <button key={i} type="button" onClick={() => selectSuggestion('pickup', s)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-start gap-3 text-sm border-b border-surface-100 last:border-0">
                        <MapPin size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                        <span className="text-surface-700 line-clamp-2">{s.label.split(',').slice(0, 3).join(', ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Destination</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-emerald-500" />
                <input
                  type="text"
                  placeholder="e.g., Gachibowli, Hyderabad"
                  value={destination.address}
                  onChange={e => { setDestination(d => ({ ...d, address: e.target.value, lat: null, lng: null })); setActiveInput('destination'); }}
                  onFocus={() => setActiveInput('destination')}
                  className="input-field pl-10 w-full"
                  required
                />
                {suggestions.destination.length > 0 && activeInput === 'destination' && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-surface-200 rounded-2xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.destination.map((s, i) => (
                      <button key={i} type="button" onClick={() => selectSuggestion('destination', s)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-start gap-3 text-sm border-b border-surface-100 last:border-0">
                        <MapPin size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-surface-700 line-clamp-2">{s.label.split(',').slice(0, 3).join(', ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-surface-400" />
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Time</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-3 text-surface-400" />
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  required
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Available Seats</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-3 text-surface-400" />
                <input
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  required
                  min="1"
                  max="8"
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Cost per Seat</label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-3 text-surface-400" />
                <input
                  type="number"
                  name="costPerSeat"
                  value={formData.costPerSeat}
                  onChange={handleChange}
                  required
                  min="0"
                  className="input-field pl-10 w-full"
                  placeholder="₹"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !pickup.lat || !destination.lat}
            className="btn-primary w-full mt-4 py-3 flex justify-center items-center gap-2"
          >
            {loading ? <span className="loading-dots"><span /><span /><span /></span> : <>Post Ride <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>

      {/* Map */}
      <div className="flex-1 h-64 lg:h-auto z-0">
        <MapView
          pickup={pickup.lat ? pickup : null}
          destination={destination.lat ? destination : null}
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  );
}

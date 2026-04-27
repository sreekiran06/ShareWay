import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Search, User, Clock, IndianRupee, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import MapView from '../../components/map/MapView';
import { carpoolService } from '../../services/api';
import useAuthStore from '../../store/authStore';

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

export default function SearchRidePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null });
  const [suggestions, setSuggestions] = useState({ pickup: [], destination: [] });
  const [activeInput, setActiveInput] = useState(null);
  const [departureDate, setDepartureDate] = useState('');

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pickup.lat || !destination.lat) {
      toast.error('Please select valid locations');
      return;
    }
    setLoading(true);
    try {
      const { data } = await carpoolService.searchRides({
        startingLocation: pickup.address,
        destination: destination.address,
        departureDate,
      });
      setRides(data.carpools || []);
      setHasSearched(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async (rideId) => {
    if (!user) {
      toast.error('Please login to request a ride');
      return;
    }
    
    try {
      await carpoolService.requestRide(rideId, { 
        seatsRequested: 1, 
        pickupLocation: pickup.address, 
        dropoffLocation: destination.address 
      });
      toast.success('Ride request sent to driver!');
      setRides(prev => prev.filter(r => r._id !== rideId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      {/* Left Panel */}
      <div className="w-full lg:w-[480px] bg-white border-r border-surface-100 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-surface-100">
          <h1 className="font-display font-bold text-xl text-surface-900">Search for a Ride</h1>
          <p className="text-surface-500 text-sm mt-1">Find a comfortable ride to your destination.</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Leaving from</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-brand-500" />
                  <input
                    type="text"
                    placeholder="e.g., City or Station"
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
                <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Going to</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-emerald-500" />
                  <input
                    type="text"
                    placeholder="e.g., Destination City"
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
              
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-surface-400" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !pickup.lat || !destination.lat}
              className="btn-primary w-full mt-2 py-3 flex justify-center items-center gap-2"
            >
              {loading ? <span className="loading-dots"><span /><span /><span /></span> : <><Search size={16} /> Search Rides</>}
            </button>
          </form>

          {/* Results Area */}
          <div className="space-y-4">
            {hasSearched && rides.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-surface-400" />
                </div>
                <h3 className="font-semibold text-surface-800">No rides found</h3>
                <p className="text-sm text-surface-500 mt-1">Try adjusting your search criteria</p>
              </div>
            )}

            {rides.map(ride => (
              <div key={ride._id} className="card p-0 overflow-hidden group">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold overflow-hidden">
                        {ride.driver?.avatar ? (
                          <img src={ride.driver.avatar} alt="Driver" className="w-full h-full object-cover" />
                        ) : (
                          ride.driver?.name?.charAt(0) || <User size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-surface-900">{ride.driver?.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-surface-500 mt-0.5">
                          <Clock size={12} className="text-brand-500" />
                          <span>{new Date(ride.departureDate).toLocaleDateString()} at {ride.departureTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-bold text-xl text-emerald-600 flex items-center justify-end">
                        <IndianRupee size={18} /> {ride.costPerSeat}
                      </span>
                      <span className="text-xs text-surface-500 block">per seat</span>
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-4 mb-5">
                    <div className="absolute left-[9px] top-6 bottom-6 w-0.5 bg-surface-200"></div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className="absolute left-[-24px] w-3 h-3 rounded-full bg-brand-500 border-2 border-white shadow-sm z-10"></div>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{ride.startingLocation}</p>
                      </div>
                    </div>
                    
                    <div className="relative flex items-center gap-3">
                      <div className="absolute left-[-24px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{ride.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-surface-100 pt-4 mt-2">
                    <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-1.5 rounded-full text-xs font-medium text-surface-700">
                      <User size={14} className="text-surface-400" />
                      {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'} left
                    </div>
                    
                    {ride.driver?._id === user?._id ? (
                      <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full">Your Ride</span>
                    ) : (
                      <button 
                        onClick={() => handleRequestRide(ride._id)}
                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                      >
                        Request Ride <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-64 lg:h-auto z-0 hidden sm:block">
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

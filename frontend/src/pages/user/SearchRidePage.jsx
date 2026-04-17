import React, { useState } from 'react';
import { MapPin, Calendar, Search, User, Clock, IndianRupee, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { carpoolService } from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function SearchRidePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [searchParams, setSearchParams] = useState({
    startingLocation: '',
    destination: '',
    departureDate: ''
  });

  const handleChange = (e) => {
    setSearchParams(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await carpoolService.searchRides(searchParams);
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
      await carpoolService.requestRide(rideId, { seatsRequested: 1 });
      toast.success('Ride request sent to driver!');
      // Update UI manually for instant feedback
      setRides(prev => prev.filter(r => r._id !== rideId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-surface-900">Search for a Ride</h1>
        <p className="text-surface-500 text-sm mt-1">Find a comfortable ride to your destination.</p>
      </div>

      <form onSubmit={handleSearch} className="card p-5 space-y-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Leaving from</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                name="startingLocation"
                value={searchParams.startingLocation}
                onChange={handleChange}
                className="input-field pl-9 w-full text-sm py-2.5"
                placeholder="City or Station"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Going to</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                name="destination"
                value={searchParams.destination}
                onChange={handleChange}
                className="input-field pl-9 w-full text-sm py-2.5"
                placeholder="City or Station"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="date"
                name="departureDate"
                value={searchParams.departureDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="input-field pl-9 w-full text-sm py-2.5"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto relative z-10 mt-2 px-6 py-2.5 text-sm flex justify-center items-center gap-2 shadow-lg shadow-brand-500/25"
        >
          {loading ? 'Searching...' : <><Search size={16} /> Search</>}
        </button>
      </form>

      {/* Results */}
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
  );
}

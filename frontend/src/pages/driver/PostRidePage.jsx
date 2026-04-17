import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, IndianRupee, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { carpoolService } from '../../services/api';

export default function PostRidePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startingLocation: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    totalSeats: 1,
    costPerSeat: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.totalSeats < 1) {
        toast.error('Available seats must be at least 1');
        setLoading(false);
        return;
      }
      
      await carpoolService.postRide(formData);
      toast.success('Ride posted successfully!');
      navigate('/driver'); // Navigate to Driver Dashboard
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 animate-fade-in max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-surface-900">Post a Ride</h1>
        <p className="text-surface-500 text-sm mt-1">Offer a ride and share travel costs.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        
        {/* Route Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Starting Location</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
              <input
                type="text"
                name="startingLocation"
                value={formData.startingLocation}
                onChange={handleChange}
                required
                className="input-field pl-10 w-full"
                placeholder="e.g., KPHB, Hyderabad"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Destination</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                className="input-field pl-10 w-full"
                placeholder="e.g., Gachibowli, Hyderabad"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Date</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
            <label className="block text-sm font-medium text-surface-700 mb-1">Time</label>
            <div className="relative">
              <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
            <label className="block text-sm font-medium text-surface-700 mb-1">Available Seats</label>
            <div className="relative">
              <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
            <label className="block text-sm font-medium text-surface-700 mb-1">Cost per Seat</label>
            <div className="relative">
              <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
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
          disabled={loading}
          className="btn-primary w-full mt-4 py-3 text-base flex justify-center items-center gap-2"
        >
          {loading ? 'Posting...' : 'Post Ride'} <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight, Car, DollarSign, Star, Clock, MapPin, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverService } from '../../services/api';
import { getSocket } from '../../services/socket';

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [pendingRides, setPendingRides] = useState([]);
  const [accepting, setAccepting] = useState(null);

  const { data: profileData } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverService.getProfile().then(r => r.data)
  });

  const { data: earningsData } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: () => driverService.getEarnings().then(r => r.data)
  });

  const driver = profileData?.driver;
  const earnings = earningsData?.earnings;

  useEffect(() => {
    if (driver) setIsOnline(driver.isOnline);
  }, [driver]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('driver_connect');
    socket.on('new_ride_request', (data) => {
      setPendingRides(prev => [data, ...prev.slice(0, 4)]);
      toast('🚗 New ride request!', { icon: '🔔' });
    });
    socket.on('new_delivery_request', (data) => {
      toast('📦 New delivery request!', { icon: '🔔' });
    });
    return () => {
      socket.off('new_ride_request');
      socket.off('new_delivery_request');
    };
  }, []);

  const handleToggleOnline = async () => {
    if (driver?.status !== 'approved') { toast.error('Your account is pending approval'); return; }
    setToggling(true);
    try {
      await driverService.updateStatus({ isOnline: !isOnline, isAvailable: !isOnline });
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online! 🟢');
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(false); }
  };

  const handleAcceptRide = async (ride) => {
    setAccepting(ride.ride._id);
    const socket = getSocket();
    if (socket) {
      socket.emit('accept_ride', { rideId: ride.ride._id });
      socket.once('ride_accept_confirmed', () => {
        toast.success('Ride accepted!');
        setPendingRides(prev => prev.filter(r => r.rideId !== ride.rideId));
      });
    }
    setAccepting(null);
  };

  const handleRejectRide = (rideId) => {
    setPendingRides(prev => prev.filter(r => r.rideId !== rideId));
  };

  if (!driver) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Status header */}
      <div className={`rounded-3xl p-6 flex items-center justify-between transition-colors duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-surface-700'}`}>
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Status</p>
          <p className="font-display font-bold text-2xl text-white">{isOnline ? 'Online — Accepting Rides' : 'Offline'}</p>
          {driver.status !== 'approved' && (
            <span className="badge bg-amber-500/30 text-amber-200 mt-2">{driver.status === 'pending' ? '⏳ Pending Approval' : driver.status}</span>
          )}
        </div>
        <button onClick={handleToggleOnline} disabled={toggling} className="p-1 rounded-full transition-all">
          {isOnline
            ? <ToggleRight size={52} className="text-white" />
            : <ToggleLeft size={52} className="text-surface-400" />}
        </button>
      </div>

      {/* Earnings grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Earnings", value: `₹${earnings?.today?.amount || 0}`, sub: `${earnings?.today?.rides || 0} rides`, color: 'text-emerald-400' },
          { label: 'This Week', value: `₹${earnings?.week?.amount || 0}`, sub: `${earnings?.week?.rides || 0} rides`, color: 'text-brand-400' },
          { label: 'Total Earned', value: `₹${earnings?.total?.amount || 0}`, sub: `${earnings?.total?.rides || 0} rides`, color: 'text-blue-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface-800 rounded-2xl p-4 text-center">
            <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{label}</p>
            <p className="text-xs text-surface-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Pending ride requests */}
      {pendingRides.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Bell size={16} className="text-brand-400" /> New Requests ({pendingRides.length})
          </h3>
          {pendingRides.map((req) => (
            <div key={req.rideId} className="bg-surface-800 border border-surface-600 rounded-2xl p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-brand">{req.ride?.rideType || 'standard'}</span>
                <span className="font-bold text-white text-lg">₹{req.ride?.fare?.total}</span>
              </div>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                  <p className="text-surface-300 truncate">{req.ride?.pickup?.address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  <p className="text-surface-300 truncate">{req.ride?.destination?.address}</p>
                </div>
                <p className="text-xs text-surface-500 flex items-center gap-1">
                  <MapPin size={10} />{req.ride?.distance?.text} · {req.ride?.duration?.text}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRejectRide(req.rideId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-600 text-surface-400 hover:bg-surface-700 transition-colors">
                  Reject
                </button>
                <button onClick={() => handleAcceptRide(req)} disabled={accepting === req.ride?._id}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors">
                  {accepting === req.ride?._id ? '...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle info */}
      <div className="bg-surface-800 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Car size={16} className="text-brand-400" /> Your Vehicle</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Make/Model', `${driver.vehicleDetails?.make} ${driver.vehicleDetails?.model}`],
            ['License Plate', driver.vehicleDetails?.licensePlate],
            ['Type', driver.vehicleDetails?.type],
            ['Rating', `⭐ ${driver.rating?.average || 'N/A'} (${driver.rating?.count || 0} ratings)`],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-surface-500 text-xs">{k}</p>
              <p className="text-surface-200 font-medium">{v || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

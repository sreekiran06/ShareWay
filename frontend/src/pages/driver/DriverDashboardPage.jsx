import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight, Car, DollarSign, Star, Clock, MapPin, Bell, IndianRupee, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverService, carpoolService } from '../../services/api';
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

  const { data: carpoolData, refetch: refetchCarpools } = useQuery({
    queryKey: ['driver-carpools'],
    queryFn: () => carpoolService.getDriverRides().then(r => r.data)
  });

  const driver = profileData?.driver;
  const earnings = earningsData?.earnings;
  const myCarpools = carpoolData?.carpools || [];

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

  const handleAcceptRequest = async (carpoolId, requestId) => {
    try {
      await carpoolService.respondToRequest(carpoolId, requestId, { status: 'accepted' });
      toast.success('Passenger request accepted!');
      refetchCarpools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (carpoolId, requestId) => {
    try {
      await carpoolService.respondToRequest(carpoolId, requestId, { status: 'rejected' });
      toast.success('Passenger request rejected');
      refetchCarpools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancelRide = async (carpoolId) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    try {
      await carpoolService.cancelRide(carpoolId);
      toast.success('Ride cancelled');
      refetchCarpools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
    }
  };

  if (!driver) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Status header */}
      <div className={`rounded-3xl p-6 flex items-center justify-between transition-colors duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-gray-200'}`}>
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">Status</p>
          <p className="font-display font-bold text-2xl text-surface-900">{isOnline ? 'Online — Accepting Rides' : 'Offline'}</p>
          {driver.status !== 'approved' && (
            <span className="badge bg-amber-500/30 text-amber-200 mt-2">{driver.status === 'pending' ? '⏳ Pending Approval' : driver.status}</span>
          )}
        </div>
        <button onClick={handleToggleOnline} disabled={toggling} className="p-1 rounded-full transition-all">
          {isOnline
            ? <ToggleRight size={52} className="text-white" />
            : <ToggleLeft size={52} className="text-gray-400" />}
        </button>
      </div>

      {/* Earnings grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Earnings", value: `₹${earnings?.today?.amount || 0}`, sub: `${earnings?.today?.rides || 0} rides`, color: 'text-emerald-400' },
          { label: 'This Week', value: `₹${earnings?.week?.amount || 0}`, sub: `${earnings?.week?.rides || 0} rides`, color: 'text-brand-400' },
          { label: 'Total Earned', value: `₹${earnings?.total?.amount || 0}`, sub: `${earnings?.total?.rides || 0} rides`, color: 'text-blue-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
            <p className="text-gray-400 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* Listed Carpools */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-surface-900 flex items-center gap-2">
          <Car size={16} className="text-brand-500" /> Your Posted Rides
        </h3>
        {myCarpools.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven't posted any rides yet.</p>
        ) : (
          myCarpools.map(carpool => (
            <div key={carpool._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${carpool.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                      {carpool.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-xs">{new Date(carpool.departureDate).toLocaleDateString()} at {carpool.departureTime}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-surface-900 text-lg flex items-center justify-end"><IndianRupee size={16} />{carpool.costPerSeat}</span>
                  <span className="text-xs text-gray-500">per seat</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-400" />
                  <p className="text-gray-700 text-sm">{carpool.startingLocation} <span className="text-gray-400 mx-1">→</span> {carpool.destination}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <p className="text-gray-600 text-sm">{carpool.availableSeats} of {carpool.totalSeats} seats left</p>
                </div>
              </div>

              {/* Rider Requests */}
              {carpool.requests?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Passenger Requests</h4>
                  <div className="space-y-2">
                    {carpool.requests.map(req => (
                      <div key={req._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                            {req.passenger?.avatar ? <img src={req.passenger.avatar} alt="Passenger" /> : req.passenger?.name?.charAt(0) || <User size={14}/>}
                          </div>
                          <div>
                            <p className="text-gray-800 text-sm font-medium">{req.passenger?.name}</p>
                            <p className="text-gray-500 text-xs">{req.seatsRequested} seat(s) • {req.status}</p>
                          </div>
                        </div>
                        {req.status === 'pending' && carpool.status === 'active' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleRejectRequest(carpool._id, req._id)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100">Reject</button>
                            <button onClick={() => handleAcceptRequest(carpool._id, req._id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">Accept</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {carpool.status === 'active' && (
                <div className="mt-4 flex justify-end">
                  <button onClick={() => handleCancelRide(carpool._id)} className="text-red-400 text-xs px-3 py-1 hover:bg-red-400/10 rounded-lg transition-colors">Cancel Ride</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

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

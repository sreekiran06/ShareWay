import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Star, X, CheckCircle, Car, Navigation, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import MapView from '../../components/map/MapView';
import { rideService } from '../../services/api';
import { getSocket } from '../../services/socket';

const STATUS_CONFIG = {
  requested:       { label: 'Searching for driver...', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  searching:       { label: 'Finding nearest driver', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  accepted:        { label: 'Driver accepted!', icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
  driver_arriving: { label: 'Driver is on the way', icon: Navigation, color: 'text-brand-500', bg: 'bg-brand-50' },
  started:         { label: 'Ride in progress', icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  completed:       { label: 'Arrived! Ride complete', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancelled:       { label: 'Ride cancelled', icon: X, color: 'text-red-500', bg: 'bg-red-50' },
};

const STEPS = ['requested', 'accepted', 'driver_arriving', 'started', 'completed'];

export default function RideTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef(null);

  const fetchRide = async () => {
    try {
      const { data } = await rideService.getStatus(id);
      setRide(data.ride);
      if (data.ride.status === 'completed' && !showRating) setShowRating(true);
    } catch {
      toast.error('Failed to load ride details');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRide();
    pollRef.current = setInterval(fetchRide, 8000);

    const socket = getSocket();
    if (socket) {
      socket.on('ride_accepted', (data) => {
        toast.success('🚗 Driver accepted your ride!');
        fetchRide();
      });
      socket.on('ride_status_update', ({ status, message }) => {
        toast.success(message || `Status: ${status}`);
        fetchRide();
        if (status === 'completed') setShowRating(true);
      });
      socket.on('driver_location_update', ({ location }) => {
        setDriverLocation(location);
      });
    }

    return () => {
      clearInterval(pollRef.current);
      if (socket) {
        socket.off('ride_accepted');
        socket.off('ride_status_update');
        socket.off('driver_location_update');
      }
    };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    setCancelling(true);
    try {
      await rideService.cancel(id, { reason: 'User cancelled' });
      toast.success('Ride cancelled');
      navigate('/');
    } catch { toast.error('Could not cancel'); }
    finally { setCancelling(false); }
  };

  const handleRate = async () => {
    try {
      await rideService.rate(id, { score: rating, comment: ratingComment });
      toast.success('Thanks for your feedback!');
      setShowRating(false);
      navigate('/');
    } catch { toast.error('Rating failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-surface-500">Loading ride...</p>
      </div>
    </div>
  );

  if (!ride) return <div className="p-8 text-center text-surface-500">Ride not found</div>;

  const statusInfo = STATUS_CONFIG[ride.status] || STATUS_CONFIG.requested;
  const StatusIcon = statusInfo.icon;
  const currentStepIdx = STEPS.indexOf(ride.status);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* Left Panel */}
      <div className="w-full lg:w-96 bg-white border-r border-surface-100 flex flex-col">
        {/* Status Header */}
        <div className={`p-6 ${statusInfo.bg} border-b border-surface-100`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm`}>
              <StatusIcon size={22} className={statusInfo.color} />
            </div>
            <div>
              <p className={`font-display font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-xs text-surface-500 font-mono">{ride.rideId}</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.slice(0, 5).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  i <= currentStepIdx ? 'bg-brand-500' : 'bg-surface-300'
                }`} />
                {i < 4 && <div className={`flex-1 h-0.5 transition-all duration-500 ${i < currentStepIdx ? 'bg-brand-500' : 'bg-surface-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* OTP */}
          {['accepted', 'driver_arriving'].includes(ride.status) && ride.otp?.value && (
            <div className="card p-4 border-2 border-brand-200 bg-brand-50">
              <p className="text-xs font-semibold text-brand-700 mb-1">Share this OTP with driver to start</p>
              <p className="font-display text-3xl font-bold text-brand-600 tracking-[0.3em]">{ride.otp.value}</p>
            </div>
          )}

          {/* Driver info */}
          {ride.driver && (
            <div className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center text-surface-500 font-bold text-xl flex-shrink-0">
                {ride.driver?.user?.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-surface-900">{ride.driver?.user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-surface-500">{ride.driver?.rating?.average || 'N/A'} · {ride.driver?.vehicleDetails?.make} {ride.driver?.vehicleDetails?.model}</span>
                </div>
                <p className="text-xs text-surface-400 font-mono mt-0.5">{ride.driver?.vehicleDetails?.licensePlate}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-sm">
                  <Phone size={15} />
                </button>
                <button className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-sm">
                  <MessageSquare size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Route summary */}
          <div className="card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 mt-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
              <div>
                <p className="text-xs text-surface-400">Pickup</p>
                <p className="text-sm font-medium text-surface-800">{ride.pickup?.address}</p>
              </div>
            </div>
            <div className="w-0.5 h-4 bg-surface-200 ml-[5px]" />
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
              <div>
                <p className="text-xs text-surface-400">Destination</p>
                <p className="text-sm font-medium text-surface-800">{ride.destination?.address}</p>
              </div>
            </div>
          </div>

          {/* Fare */}
          <div className="card p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-surface-400">Estimated Fare</p>
                <p className="font-display font-bold text-2xl text-surface-900">₹{ride.fare?.total}</p>
              </div>
              <div className="text-right">
                <span className="badge badge-neutral capitalize">{ride.payment?.method}</span>
                <p className="text-xs text-surface-400 mt-1">{ride.distance?.text} · {ride.duration?.text}</p>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {['requested', 'searching', 'accepted', 'driver_arriving'].includes(ride.status) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold transition-all duration-200">
              {cancelling ? 'Cancelling...' : 'Cancel Ride'}
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 h-64 lg:h-auto">
        <MapView
          pickup={ride.pickup ? { ...ride.pickup.coordinates, address: ride.pickup.address } : null}
          destination={ride.destination ? { ...ride.destination.coordinates, address: ride.destination.address } : null}
          driverLocation={driverLocation}
          height="100%"
          className="rounded-none"
        />
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center animate-slide-up shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="font-display font-bold text-2xl text-surface-900 mb-1">You've arrived!</h2>
            <p className="text-surface-500 text-sm mb-6">How was your ride with {ride.driver?.user?.name?.split(' ')[0]}?</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star size={32} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Any comments? (optional)"
              className="input-field text-sm resize-none mb-4"
              rows={2}
            />
            <button onClick={handleRate} disabled={!rating} className="btn-primary w-full">Submit Rating</button>
            <button onClick={() => { setShowRating(false); navigate('/'); }} className="btn-ghost w-full mt-2">Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}

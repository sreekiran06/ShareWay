import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, Clock, CheckCircle, Truck } from 'lucide-react';
import { deliveryService } from '../../services/api';
import { format } from 'date-fns';

const STATUS_STEPS = ['requested', 'accepted', 'picked_up', 'in_transit', 'delivered'];
const STATUS_LABELS = {
  requested: 'Order Placed', accepted: 'Driver Assigned',
  picked_up: 'Package Picked Up', in_transit: 'Out for Delivery', delivered: 'Delivered!'
};
const STATUS_ICONS = { requested: Clock, accepted: Truck, picked_up: Package, in_transit: Truck, delivered: CheckCircle };

export default function DeliveryTrackingPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveryService.getStatus(id).then(r => r.data),
    refetchInterval: 10000
  });
  const delivery = data?.delivery;
  const currentStep = STATUS_STEPS.indexOf(delivery?.status);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!delivery) return <div className="p-8 text-center text-surface-500">Delivery not found</div>;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-1">Track Delivery</h1>
        <p className="text-xs text-surface-400 font-mono">{delivery.deliveryId}</p>
      </div>

      {/* Status card */}
      <div className="card p-6">
        <div className="space-y-4">
          {STATUS_STEPS.map((s, i) => {
            const Icon = STATUS_ICONS[s];
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={s} className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  done ? (active ? 'bg-brand-500 animate-pulse-brand' : 'bg-emerald-500') : 'bg-surface-200'
                }`}>
                  <Icon size={16} className={done ? 'text-white' : 'text-surface-400'} />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className={`text-sm font-semibold ${done ? 'text-surface-900' : 'text-surface-400'}`}>{STATUS_LABELS[s]}</p>
                  {active && <p className="text-xs text-brand-500 font-medium animate-pulse">In progress...</p>}
                  {delivery.timeline?.[`${s === 'picked_up' ? 'pickedUpAt' : s === 'in_transit' ? 'pickedUpAt' : s === 'delivered' ? 'deliveredAt' : s + 'At'}`] && (
                    <p className="text-xs text-surface-400">
                      {format(new Date(delivery.timeline[s === 'picked_up' ? 'pickedUpAt' : s === 'delivered' ? 'deliveredAt' : s === 'accepted' ? 'acceptedAt' : 'requestedAt']), 'h:mm a')}
                    </p>
                  )}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 mt-9 absolute ml-4 ${i < currentStep ? 'bg-emerald-500' : 'bg-surface-200'}`} style={{ position: 'absolute' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Route */}
      <div className="card p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 mt-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
          <div><p className="text-xs text-surface-400">Pickup</p><p className="text-sm font-medium text-surface-800">{delivery.pickup?.address}</p></div>
        </div>
        <div className="w-0.5 h-4 bg-surface-200 ml-[5px]" />
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 mt-1.5 bg-red-500 rounded-full flex-shrink-0" />
          <div><p className="text-xs text-surface-400">Delivery</p><p className="text-sm font-medium text-surface-800">{delivery.destination?.address}</p></div>
        </div>
      </div>

      {/* Package info */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <Package size={16} className="text-brand-500" />
          <p className="font-medium text-surface-900">{delivery.package?.description}</p>
          <span className="badge badge-neutral ml-auto">{delivery.package?.category}</span>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-100">
          <span className="text-sm text-surface-500">Total Fare</span>
          <span className="font-bold text-lg text-brand-600">₹{delivery.fare?.total}</span>
        </div>
      </div>
    </div>
  );
}

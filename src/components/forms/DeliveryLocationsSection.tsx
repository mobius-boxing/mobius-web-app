import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import {
  DeliveryLocationRecord,
  DeliveryZone,
} from '../../types';
import { deliveryLocationsApi, deliveryZonesApi } from '../../services/api';
import Button from '../ui/Button';
import { logger } from '../../utils/logger';

interface DeliveryLocationsSectionProps {
  customerUuid: string;
}

interface LocationDraft {
  uuid?: string;
  address: string;
  schedule: string;
  latitude: string;
  longitude: string;
  externalSystemCode: string;
  deliveryZoneUuid: string;
}

const emptyDraft: LocationDraft = {
  address: '',
  schedule: '',
  latitude: '',
  longitude: '',
  externalSystemCode: '',
  deliveryZoneUuid: '',
};

/**
 * Delivery locations manager (LugaresDeEntrega) — a real resource since
 * migration 20260720000008, nested in the Customer edit flow. The delivery
 * zone is REQUIRED (§L.6).
 */
const DeliveryLocationsSection: React.FC<DeliveryLocationsSectionProps> = ({ customerUuid }) => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<DeliveryLocationRecord[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [locationsRes, zonesRes] = await Promise.all([
        deliveryLocationsApi.getDeliveryLocations({ customerUuid, limit: 100 }),
        deliveryZonesApi.getDeliveryZones({ limit: 200 }),
      ]);
      setLocations(locationsRes.data || []);
      setZones(zonesRes.data || []);
    } catch (err) {
      logger.error('Error loading delivery locations:', err);
    }
  }, [customerUuid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.deliveryZoneUuid) {
      setError(t('common:customerModal.deliveryZoneRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        address: draft.address || undefined,
        schedule: draft.schedule || undefined,
        latitude: draft.latitude ? parseFloat(draft.latitude) : undefined,
        longitude: draft.longitude ? parseFloat(draft.longitude) : undefined,
        externalSystemCode: draft.externalSystemCode || undefined,
        deliveryZoneUuid: draft.deliveryZoneUuid,
      };
      if (draft.uuid) {
        await deliveryLocationsApi.updateDeliveryLocation(draft.uuid, payload);
      } else {
        await deliveryLocationsApi.createDeliveryLocation({ ...payload, customerUuid });
      }
      setDraft(null);
      await refresh();
    } catch (err: any) {
      logger.error('Error saving delivery location:', err);
      setError(err?.response?.data?.message || t('common:customerModal.locationSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const removeLocation = async (uuid: string) => {
    try {
      await deliveryLocationsApi.deleteDeliveryLocation(uuid);
      await refresh();
    } catch (err) {
      logger.error('Error deleting delivery location:', err);
    }
  };

  const inputClass =
    'w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-4 bg-secondary-50/30 rounded-lg p-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-sm font-semibold text-secondary-900">
          {t('common:customerModal.deliveryLocations')}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setDraft({ ...emptyDraft })}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('common:customerModal.addLocation')}
        </Button>
      </div>

      {locations.length === 0 && !draft && (
        <p className="text-sm text-secondary-500 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('common:customerModal.noLocations')}
        </p>
      )}

      {locations.map((location) => (
        <div
          key={location.uuid}
          className="bg-white border border-secondary-200 rounded-lg p-3 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {location.address || t('common:customerModal.noAddress')}
            </p>
            <p className="text-xs text-secondary-500">
              {location.deliveryZone
                ? `${t('common:customerModal.deliveryZone')}: ${location.deliveryZone.code || location.deliveryZone.description}`
                : '—'}
              {location.schedule ? ` · ${location.schedule}` : ''}
              {location.externalSystemCode ? ` · ${location.externalSystemCode}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setDraft({
                  uuid: location.uuid,
                  address: location.address || '',
                  schedule: location.schedule || '',
                  latitude: location.latitude != null ? String(location.latitude) : '',
                  longitude: location.longitude != null ? String(location.longitude) : '',
                  externalSystemCode: location.externalSystemCode || '',
                  deliveryZoneUuid: location.deliveryZone?.uuid || '',
                })
              }
              className="p-1 text-secondary-500 hover:text-secondary-800"
              title={t('common:customerModal.editLocation')}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeLocation(location.uuid)}
              className="p-1 text-red-600 hover:text-red-800"
              title={t('common:customerModal.remove')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {draft && (
        <div className="bg-white border border-primary-200 rounded-lg p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder={`${t('common:customerModal.address')} *`}
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              className={inputClass}
            />
            <select
              value={draft.deliveryZoneUuid}
              onChange={(e) => setDraft({ ...draft, deliveryZoneUuid: e.target.value })}
              className={inputClass}
            >
              <option value="">{`${t('common:customerModal.selectDeliveryZone')} *`}</option>
              {zones.map((zone) => (
                <option key={zone.uuid} value={zone.uuid}>
                  {zone.code || zone.description}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t('common:customerModal.availableTimes')}
              value={draft.schedule}
              onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder={t('common:customerModal.latitude')}
              value={draft.latitude}
              onChange={(e) => setDraft({ ...draft, latitude: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder={t('common:customerModal.longitude')}
              value={draft.longitude}
              onChange={(e) => setDraft({ ...draft, longitude: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder={t('common:customerModal.externalSystemCode')}
              value={draft.externalSystemCode}
              onChange={(e) => setDraft({ ...draft, externalSystemCode: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setDraft(null); setError(null); }}>
              {t('common:customerModal.cancel')}
            </Button>
            <Button type="button" size="sm" loading={saving} onClick={saveDraft}>
              {draft.uuid
                ? t('common:customerModal.updateLocation')
                : t('common:customerModal.saveLocation')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocationsSection;

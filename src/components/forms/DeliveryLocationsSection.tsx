import React, { useCallback, useEffect, useState } from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import {
  CustomerDeliveryLocationInput,
  DeliveryLocationRecord,
  DeliveryZone,
} from '../../types';
import { deliveryLocationsApi, deliveryZonesApi } from '../../services/api';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import { logger } from '../../utils/logger';

interface DeliveryLocationsSectionProps {
  /** Present in edit mode — the section fetches and mutates real rows. */
  customerUuid?: string;
  /** Create mode: the in-memory list sent as `deliveryLocations` on submit. */
  pending?: CustomerDeliveryLocationInput[];
  onPendingChange?: (next: CustomerDeliveryLocationInput[]) => void;
}

interface LocationDraft {
  uuid?: string;
  address: string;
  schedule: string;
  latitude: string;
  longitude: string;
  externalSystemCode: string;
  deliveryZoneUuid: string;
  isCustomerAddress: boolean;
}

const emptyDraft: LocationDraft = {
  address: '',
  schedule: '',
  latitude: '',
  longitude: '',
  externalSystemCode: '',
  deliveryZoneUuid: '',
  isCustomerAddress: false,
};

function draftToPayload(draft: LocationDraft): CustomerDeliveryLocationInput {
  return {
    address: draft.isCustomerAddress ? undefined : draft.address || undefined,
    schedule: draft.schedule || undefined,
    latitude: draft.latitude ? parseFloat(draft.latitude) : undefined,
    longitude: draft.longitude ? parseFloat(draft.longitude) : undefined,
    externalSystemCode: draft.externalSystemCode || undefined,
    deliveryZoneUuid: draft.deliveryZoneUuid,
  };
}

/**
 * Delivery locations manager (LugaresDeEntrega) — a real resource since
 * migration 20260720000008, nested in the Customer edit flow. The delivery
 * zone is REQUIRED (§L.6).
 *
 * Without a `customerUuid` (customer create modal) there is no row to fetch
 * or POST yet: the section holds the list in `pending`/`onPendingChange`
 * instead, and the caller sends it as part of the customer's own create
 * payload (Amendment 2).
 */
const DeliveryLocationsSection: React.FC<DeliveryLocationsSectionProps> = ({
  customerUuid,
  pending,
  onPendingChange,
}) => {
  const isPending = !customerUuid;
  const { effectiveCompanyId } = useEffectiveCompany();
  const { t } = useTranslation();
  const [locations, setLocations] = useState<DeliveryLocationRecord[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [pendingEditingIndex, setPendingEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const zonesFilter = { limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) };
      if (customerUuid) {
        const [locationsRes, zonesRes] = await Promise.all([
          deliveryLocationsApi.getDeliveryLocations({ customerUuid, limit: 100 }),
          deliveryZonesApi.getDeliveryZones(zonesFilter),
        ]);
        setLocations(locationsRes.data || []);
        setZones(zonesRes.data || []);
      } else {
        const zonesRes = await deliveryZonesApi.getDeliveryZones(zonesFilter);
        setZones(zonesRes.data || []);
      }
    } catch (err) {
      logger.error('Error loading delivery locations:', err);
    }
  }, [customerUuid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.isCustomerAddress && !draft.address.trim()) {
      setError(t('common:customerModal.deliveryAddressRequired'));
      return;
    }
    if (!draft.deliveryZoneUuid) {
      setError(t('common:customerModal.deliveryZoneRequired'));
      return;
    }

    if (isPending) {
      const payload = draftToPayload(draft);
      const next = [...(pending || [])];
      if (pendingEditingIndex !== null) {
        next[pendingEditingIndex] = payload;
      } else {
        next.push(payload);
      }
      onPendingChange?.(next);
      setDraft(null);
      setPendingEditingIndex(null);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = draftToPayload(draft);
      if (draft.uuid) {
        await deliveryLocationsApi.updateDeliveryLocation(draft.uuid, payload);
      } else {
        await deliveryLocationsApi.createDeliveryLocation({ ...payload, customerUuid: customerUuid! });
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

  const removePending = (index: number) => {
    onPendingChange?.((pending || []).filter((_, i) => i !== index));
  };

  const editPending = (index: number, item: CustomerDeliveryLocationInput) => {
    setPendingEditingIndex(index);
    setDraft({
      address: item.address || '',
      schedule: item.schedule || '',
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
      externalSystemCode: item.externalSystemCode || '',
      deliveryZoneUuid: item.deliveryZoneUuid,
      isCustomerAddress: false,
    });
  };

  const inputClass =
    'w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  const pendingList = pending || [];

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
          onClick={() => {
            setPendingEditingIndex(null);
            setDraft({ ...emptyDraft });
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('common:customerModal.addLocation')}
        </Button>
      </div>

      {isPending && (
        <p className="text-sm text-secondary-500">
          {t('common:customerModal.customerAddressAutoHint')}
        </p>
      )}

      {isPending ? (
        <>
          {pendingList.length === 0 && !draft && (
            <p className="text-sm text-secondary-500 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('common:customerModal.noLocations')}
            </p>
          )}

          {pendingList.map((item, index) => {
            const zone = zones.find((z) => z.uuid === item.deliveryZoneUuid);
            return (
              <div
                key={index}
                className="bg-white border border-secondary-200 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {item.address || t('common:customerModal.noAddress')}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {zone
                      ? `${t('common:customerModal.deliveryZone')}: ${zone.code || zone.description}`
                      : '—'}
                    {item.schedule ? ` · ${item.schedule}` : ''}
                    {item.externalSystemCode ? ` · ${item.externalSystemCode}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionButton
                    label={t('common:customerModal.editLocation')}
                    onClick={() => editPending(index, item)}
                  >
                    <Edit className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    label={t('common:customerModal.remove')}
                    tone="danger"
                    onClick={() => removePending(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
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
                  {location.isCustomerAddress && (
                    <span className="ml-2 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
                      {t('common:customerModal.customerAddressBadge')}
                    </span>
                  )}
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
                <ActionButton
                  label={t('common:customerModal.editLocation')}
                  onClick={() =>
                    setDraft({
                      uuid: location.uuid,
                      address: location.address || '',
                      schedule: location.schedule || '',
                      latitude: location.latitude != null ? String(location.latitude) : '',
                      longitude: location.longitude != null ? String(location.longitude) : '',
                      externalSystemCode: location.externalSystemCode || '',
                      deliveryZoneUuid: location.deliveryZone?.uuid || '',
                      isCustomerAddress: location.isCustomerAddress || false,
                    })
                  }
                >
                  <Edit className="h-4 w-4" />
                </ActionButton>
                {!location.isCustomerAddress && (
                  <ActionButton
                    label={t('common:customerModal.remove')}
                    tone="danger"
                    onClick={() => removeLocation(location.uuid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {draft && (
        <div className="bg-white border border-primary-200 rounded-lg p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {draft.isCustomerAddress ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-secondary-900">{draft.address}</p>
                <p className="text-xs text-secondary-500">
                  {t('common:customerModal.customerAddressHint')}
                </p>
              </div>
            ) : (
              <input
                type="text"
                placeholder={`${t('common:customerModal.address')} *`}
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className={inputClass}
              />
            )}
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(null);
                setPendingEditingIndex(null);
                setError(null);
              }}
            >
              {t('common:customerModal.cancel')}
            </Button>
            <Button type="button" size="sm" loading={saving} onClick={saveDraft}>
              {(isPending ? pendingEditingIndex !== null : !!draft.uuid)
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

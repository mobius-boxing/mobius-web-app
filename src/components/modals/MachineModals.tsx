import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Machine, MachineType, CreateMachineForm, Warehouse } from '../../types';
import { machinesApi, machineTypesApi, warehousesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import {
  createMachineSchema,
  editMachineSchema,
} from '../../validation/schemas/machine';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Shared field set for both machine modals. */
const MachineFields: React.FC<{
  register: any;
  errors: any;
  machineTypes: MachineType[];
  warehouses: Warehouse[];
  /** Selected `machineTypeUuid`, to gate the corrugator fields below. */
  selectedTypeUuid?: string;
}> = ({ register, errors, machineTypes, warehouses, selectedTypeUuid }) => {
  const { t } = useTranslation();
  const selectedType = machineTypes.find((mt) => mt.uuid === selectedTypeUuid);
  // Shown whenever the form knows the type IS corrugated, or does not know the
  // type yet (new machine, type list still loading) — never hidden by default.
  const showCorrugatorFields = !selectedType || selectedType.corrugated;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="gd-label">
            {t('machines.code')}
          </label>
          <Input {...register('code')} error={errors.code?.message as string} />
        </div>
        <div>
          <label className="gd-label">
            {t('machines.machineType')} *
          </label>
          <select
            className="input-field w-full"
            {...register('machineTypeUuid')}
          >
            <option value="">{t('machines.selectType')}</option>
            {machineTypes.map((mt) => (
              <option key={mt.uuid} value={mt.uuid}>
                {mt.name}
              </option>
            ))}
          </select>
          {errors.machineTypeUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.machineTypeUuid.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="gd-label">
          {t('machines.description')}
        </label>
        <Input {...register('description')} error={errors.description?.message as string} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="gd-label">
            {t('machines.setupTime')}
          </label>
          <Input type="number" step="any" {...register('setupTime')} error={errors.setupTime?.message as string} />
        </div>
        <div>
          <label className="gd-label">
            {t('machines.sheetWidthMin')}
          </label>
          <Input type="number" step="any" {...register('sheetWidthMin')} error={errors.sheetWidthMin?.message as string} />
        </div>
        <div>
          <label className="gd-label">
            {t('machines.sheetWidthMax')}
          </label>
          <Input type="number" step="any" {...register('sheetWidthMax')} error={errors.sheetWidthMax?.message as string} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="gd-label">
            {t('machines.sourceWarehouse')}
          </label>
          <select className="input-field w-full" {...register('sourceWarehouseUuid')}>
            <option value="">{t('machines.selectWarehouse')}</option>
            {warehouses.map((w) => (
              <option key={w.uuid} value={w.uuid}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.sourceWarehouseUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.sourceWarehouseUuid.message as string}</p>
          )}
        </div>
        <div>
          <label className="gd-label">
            {t('machines.destinationWarehouse')}
          </label>
          <select className="input-field w-full" {...register('destinationWarehouseUuid')}>
            <option value="">{t('machines.selectWarehouse')}</option>
            {warehouses.map((w) => (
              <option key={w.uuid} value={w.uuid}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.destinationWarehouseUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.destinationWarehouseUuid.message as string}</p>
          )}
        </div>
      </div>
      {showCorrugatorFields && (
        <div className="space-y-3 rounded-lg border border-secondary-200 p-3">
          <p className="gd-label">{t('machines.corrugatorSection')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="gd-label">{t('machines.trim')}</label>
              <Input type="number" step="any" {...register('trim')} error={errors.trim?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.maxElements')}</label>
              <Input type="number" step="1" {...register('maxElements')} error={errors.maxElements?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.tableCount')}</label>
              <Input type="number" step="1" {...register('tableCount')} error={errors.tableCount?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="gd-label">{t('machines.formatsPerTable')}</label>
              <Input type="number" step="1" {...register('formatsPerTable')} error={errors.formatsPerTable?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.ordersPerFormat')}</label>
              <Input type="number" step="1" {...register('ordersPerFormat')} error={errors.ordersPerFormat?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.ordersPerTable')}</label>
              <Input type="number" step="1" {...register('ordersPerTable')} error={errors.ordersPerTable?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="gd-label">{t('machines.sheetLengthMin')}</label>
              <Input type="number" step="any" {...register('sheetLengthMin')} error={errors.sheetLengthMin?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.sheetLengthMax')}</label>
              <Input type="number" step="any" {...register('sheetLengthMax')} error={errors.sheetLengthMax?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
            <div>
              <label className="gd-label">{t('machines.maxScoreLines')}</label>
              <Input type="number" step="1" {...register('maxScoreLines')} error={errors.maxScoreLines?.message as string} helperText={t('machines.unlimitedHint')} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const useMachineDropdowns = (isOpen: boolean) => {
  const { effectiveCompanyId } = useEffectiveCompany();
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
    Promise.all([
      machineTypesApi.getMachineTypes({ limit: 100, ...companyFilter }),
      warehousesApi.getWarehouses({ limit: 100, ...companyFilter }),
    ])
      .then(([types, whs]) => {
        setMachineTypes(types.data);
        setWarehouses(whs.data);
      })
      .catch((err) => logger.error('Error fetching machine dropdown data:', err));
  }, [isOpen, effectiveCompanyId]);
  return { machineTypes, warehouses };
};

const clean = (data: CreateMachineForm): CreateMachineForm => {
  const out: any = { ...data };
  for (const key of ['sourceWarehouseUuid', 'destinationWarehouseUuid'] as const) {
    if (!out[key]) delete out[key];
  }
  return out;
};

export const CreateMachineModal: React.FC<BaseProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const { machineTypes, warehouses } = useMachineDropdowns(isOpen);

  const {
    form: { register, handleSubmit: formSubmit, formState: { errors }, watch },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateMachineForm>({ defaultValues: {}, onSuccess, onClose, schema: createMachineSchema(t) });

  const onSubmit = handleSubmit((data) =>
    machinesApi.createMachine({ ...clean(data), companyId: effectiveCompanyId })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('machines.createTitle')} size="lg">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <MachineFields
          register={register}
          errors={errors}
          machineTypes={machineTypes}
          warehouses={warehouses}
          selectedTypeUuid={watch('machineTypeUuid')}
        />
        <ModalFooter onCancel={handleClose} loading={loading} submitText={t('machines.createButton')} />
      </form>
    </Modal>
  );
};

export const EditMachineModal: React.FC<BaseProps & { machine: Machine | null }> = ({
  isOpen,
  onClose,
  onSuccess,
  machine,
}) => {
  const { t } = useTranslation();
  const { machineTypes, warehouses } = useMachineDropdowns(isOpen);

  const {
    form: { register, handleSubmit: formSubmit, formState: { errors }, reset, watch },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateMachineForm>({
    defaultValues: {},
    onSuccess,
    onClose,
    schema: editMachineSchema(t),
  });

  useEffect(() => {
    if (isOpen && machine) {
      reset({
        code: machine.code ?? '',
        description: machine.description ?? '',
        machineTypeUuid: machine.machineType?.uuid ?? '',
        setupTime: machine.setupTime ?? 0,
        sheetWidthMin: machine.sheetWidthMin ?? undefined,
        sheetWidthMax: machine.sheetWidthMax ?? undefined,
        sourceWarehouseUuid: machine.sourceWarehouse?.uuid ?? '',
        destinationWarehouseUuid: machine.destinationWarehouse?.uuid ?? '',
        trim: machine.trim ?? undefined,
        maxElements: machine.maxElements ?? undefined,
        tableCount: machine.tableCount ?? undefined,
        formatsPerTable: machine.formatsPerTable ?? undefined,
        ordersPerFormat: machine.ordersPerFormat ?? undefined,
        ordersPerTable: machine.ordersPerTable ?? undefined,
        sheetLengthMin: machine.sheetLengthMin ?? undefined,
        sheetLengthMax: machine.sheetLengthMax ?? undefined,
        maxScoreLines: machine.maxScoreLines ?? undefined,
      });
    }
    // Re-applied when the dropdown lists arrive: a select reset before its options exist shows the placeholder.
  }, [isOpen, machine, reset, machineTypes, warehouses]);

  const onSubmit = handleSubmit((data) =>
    machinesApi.updateMachine(machine!.uuid, clean(data))
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('machines.editTitle')} size="lg">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <MachineFields
          register={register}
          errors={errors}
          machineTypes={machineTypes}
          warehouses={warehouses}
          selectedTypeUuid={watch('machineTypeUuid')}
        />
        <ModalFooter onCancel={handleClose} loading={loading} submitText={t('machines.editButton')} />
      </form>
    </Modal>
  );
};

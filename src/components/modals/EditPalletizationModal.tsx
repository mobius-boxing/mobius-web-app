import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palletization, CreatePalletizationForm, PalletType } from '../../types';
import { palletizationsApi, palletTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { editPalletizationSchema } from '../../validation/schemas/palletization';
import Modal from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import PalletizationFormFields from '../forms/PalletizationFormFields';
import { logger } from '../../utils/logger';

interface EditPalletizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  palletization: Palletization | null;
}

const EditPalletizationModal: React.FC<EditPalletizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  palletization,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [technicalFileUuid, setTechnicalFileUuid] = useState<string | null>(null);
  const [imageFileUuid, setImageFileUuid] = useState<string | null>(null);

  const {
    form: { register, handleSubmit: formSubmit, watch, reset, formState: { errors } },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreatePalletizationForm>({ defaultValues: {}, onSuccess, onClose, schema: editPalletizationSchema(t) });

  useEffect(() => {
    if (isOpen && palletization) {
      reset({
        code: palletization.code ?? '',
        name: palletization.name,
        description: palletization.description ?? '',
        boxesPerPackage: palletization.boxesPerPackage,
        packagesPerLevel: palletization.packagesPerLevel,
        levelsPerPallet: palletization.levelsPerPallet,
        additionalPackages: palletization.additionalPackages,
        sheetsPerPallet: palletization.sheetsPerPallet,
        maxPalletHeight: palletization.maxPalletHeight ?? undefined,
        surface: palletization.surface ?? undefined,
        stackingType: palletization.stackingType ?? '',
        observations: palletization.observations ?? '',
        palletTypeUuid: palletization.palletType?.uuid ?? '',
      });
      setTechnicalFileUuid(palletization.technicalFileUuid ?? null);
      setImageFileUuid(palletization.imageFileUuid ?? null);
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      palletTypesApi
        .getPalletTypes({ limit: 100, ...companyFilter })
        .then((res) => setPalletTypes(res.data || []))
        .catch((err) => logger.error('Error fetching pallet types:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, palletization, effectiveCompanyId]);

  const onSubmit = handleSubmit((data) => {
    if (!palletization) return Promise.reject(new Error('No palletization selected'));
    return palletizationsApi.updatePalletization(palletization.uuid, {
      ...data,
      palletTypeUuid: data.palletTypeUuid || undefined,
      technicalFileUuid,
      imageFileUuid,
    });
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('palletizations.editTitle')} size="xl">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <PalletizationFormFields
          register={register}
          errors={errors}
          watch={watch}
          palletTypes={palletTypes}
          technicalFileUuid={technicalFileUuid}
          imageFileUuid={imageFileUuid}
          onTechnicalFileChange={setTechnicalFileUuid}
          onImageFileChange={setImageFileUuid}
        />
        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('common.save')} />
      </form>
    </Modal>
  );
};

export default EditPalletizationModal;

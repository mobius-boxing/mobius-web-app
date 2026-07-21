import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePalletizationForm, PalletType } from '../../types';
import { palletizationsApi, palletTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import PalletizationFormFields from '../forms/PalletizationFormFields';
import { logger } from '../../utils/logger';

interface CreatePalletizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePalletizationModal: React.FC<CreatePalletizationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [technicalFileUuid, setTechnicalFileUuid] = useState<string | null>(null);
  const [imageFileUuid, setImageFileUuid] = useState<string | null>(null);

  const {
    form: { register, handleSubmit: formSubmit, watch, formState: { errors } },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreatePalletizationForm>({ defaultValues: {}, onSuccess, onClose });

  useEffect(() => {
    if (isOpen) {
      setTechnicalFileUuid(null);
      setImageFileUuid(null);
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      palletTypesApi
        .getPalletTypes({ limit: 100, ...companyFilter })
        .then((res) => setPalletTypes(res.data || []))
        .catch((err) => logger.error('Error fetching pallet types:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, effectiveCompanyId]);

  const n = (v: any) => (v === '' || v === undefined ? undefined : Number(v));
  const onSubmit = handleSubmit((data) =>
    palletizationsApi.createPalletization({
      ...data,
      boxesPerPackage: n(data.boxesPerPackage),
      packagesPerLevel: n(data.packagesPerLevel),
      levelsPerPallet: n(data.levelsPerPallet),
      additionalPackages: n(data.additionalPackages),
      sheetsPerPallet: n(data.sheetsPerPallet),
      maxPalletHeight: n(data.maxPalletHeight),
      surface: n(data.surface),
      palletTypeUuid: data.palletTypeUuid || undefined,
      technicalFileUuid,
      imageFileUuid,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('palletizations.createTitle')} size="xl">
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
        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('palletizations.createButton')} />
      </form>
    </Modal>
  );
};

export default CreatePalletizationModal;

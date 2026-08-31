import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PalletType, CreatePalletTypeForm } from '../../types';
import { palletTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { editPalletTypeSchema } from '../../validation/schemas/palletType';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditPalletTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  palletType: PalletType | null;
}

const EditPalletTypeModal: React.FC<EditPalletTypeModalProps> = ({ isOpen, onClose, onSuccess, palletType }) => {
  const { t } = useTranslation();
  const {
    form: { register, handleSubmit: formSubmit, reset, formState: { errors } },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreatePalletTypeForm>({ defaultValues: {}, onSuccess, onClose, schema: editPalletTypeSchema(t) });

  useEffect(() => {
    if (isOpen && palletType) {
      reset({
        code: palletType.code ?? '',
        description: palletType.description ?? '',
        length: palletType.length ?? undefined,
        width: palletType.width ?? undefined,
        weight: palletType.weight ?? undefined,
        height: palletType.height ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, palletType]);

  const onSubmit = handleSubmit((data) => {
    if (!palletType) return Promise.reject(new Error('No pallet type selected'));
    return palletTypesApi.updatePalletType(palletType.uuid, {
      ...data,
    });
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('palletTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('code')}
            label={`${t('palletTypes.code')} *`}
            error={errors.code?.message}
          />
          <Input {...register('description')} error={errors.description?.message as string} label={t('palletTypes.description')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input {...register('length')} error={errors.length?.message as string} type="number" step="any" label={t('palletTypes.length')} placeholder="mm" />
          <Input {...register('width')} error={errors.width?.message as string} type="number" step="any" label={t('palletTypes.width')} placeholder="mm" />
          <Input {...register('height')} error={errors.height?.message as string} type="number" step="any" label={t('palletTypes.height')} placeholder="mm" />
          <Input {...register('weight')} error={errors.weight?.message as string} type="number" step="any" label={t('palletTypes.weight')} placeholder="kg" />
        </div>
        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('common.save')} />
      </form>
    </Modal>
  );
};

export default EditPalletTypeModal;

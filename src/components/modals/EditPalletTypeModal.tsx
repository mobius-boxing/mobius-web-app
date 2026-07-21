import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PalletType, CreatePalletTypeForm } from '../../types';
import { palletTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
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
  } = useModalForm<CreatePalletTypeForm>({ defaultValues: {}, onSuccess, onClose });

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

  const num = (v: any) => (v === '' || v === undefined ? undefined : Number(v));
  const onSubmit = handleSubmit((data) => {
    if (!palletType) return Promise.reject(new Error('No pallet type selected'));
    return palletTypesApi.updatePalletType(palletType.uuid, {
      ...data,
      length: num(data.length),
      width: num(data.width),
      weight: num(data.weight),
      height: num(data.height),
    });
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('palletTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('code', { required: t('palletTypes.validation.codeRequired') })}
            label={`${t('palletTypes.code')} *`}
            error={errors.code?.message}
          />
          <Input {...register('description')} label={t('palletTypes.description')} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input {...register('length')} type="number" step="any" label={t('palletTypes.length')} placeholder="mm" />
          <Input {...register('width')} type="number" step="any" label={t('palletTypes.width')} placeholder="mm" />
          <Input {...register('height')} type="number" step="any" label={t('palletTypes.height')} placeholder="mm" />
          <Input {...register('weight')} type="number" step="any" label={t('palletTypes.weight')} placeholder="kg" />
        </div>
        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('common.save')} />
      </form>
    </Modal>
  );
};

export default EditPalletTypeModal;

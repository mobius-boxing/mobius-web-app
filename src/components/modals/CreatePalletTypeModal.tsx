import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePalletTypeForm } from '../../types';
import { palletTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreatePalletTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePalletTypeModal: React.FC<CreatePalletTypeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const {
    form: { register, handleSubmit: formSubmit, formState: { errors } },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreatePalletTypeForm>({ defaultValues: {}, onSuccess, onClose });

  const num = (v: any) => (v === '' || v === undefined ? undefined : Number(v));
  const onSubmit = handleSubmit((data) =>
    palletTypesApi.createPalletType({
      ...data,
      length: num(data.length),
      width: num(data.width),
      weight: num(data.weight),
      height: num(data.height),
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('palletTypes.createTitle')}>
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
        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('palletTypes.createButton')} />
      </form>
    </Modal>
  );
};

export default CreatePalletTypeModal;

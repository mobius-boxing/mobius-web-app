import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Tabs, { TabItem } from '../ui/Tabs';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { productSchema } from '../../validation/schemas/product';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import {
  productsApi,
  customersApi,
  corrugationsApi,
  productionRoutesApi,
  palletizationsApi,
  modelsApi,
  flapTypesApi,
  glueTypesApi,
  strappingTypesApi,
  traceTypesApi,
  complementsApi,
} from '../../services/api';
import {
  Product,
  CreateProductForm,
  Customer,
  Corrugation,
  ProductionRoute,
  Model,
  FlapType,
  GlueType,
  StrappingType,
  TraceType,
  Complement,
  Palletization,
  ProductApprovalStatus,
} from '../../types';
import { logger } from '../../utils/logger';
import ProductGeneralTab, { FileUuids } from './ProductGeneralTab';
import ProductProductionTab from './ProductProductionTab';
import ProductRouteTab from './ProductRouteTab';
import ProductPalletizingTab from './ProductPalletizingTab';

interface Options {
  uuid: string;
  label: string;
}

export interface ProductFormOptions {
  customers: Options[];
  corrugations: Options[];
  models: Options[];
  flapTypes: Options[];
  glueTypes: Options[];
  strappingTypes: Options[];
  traceTypes: Options[];
  complements: Options[];
  palletizations: Options[];
  globalRoutes: Options[];
}

interface Props {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** null for create; the product being edited otherwise. */
  product: Product | null;
}

type TabKey = 'general' | 'production' | 'route' | 'palletizing';

/** Numeric context sent in `values` (the endpoint's full calculable snapshot). */
const CALC_FIELDS = [
  'boxLength',
  'boxWidth',
  'boxHeight',
  'externalLength',
  'externalWidth',
  'externalHeight',
  'boxSurface',
  'grammage',
  'sheetLength',
  'sheetWidth',
  'additionalSheetLength',
  'flap',
  'lowerFlap',
  'upperFlap',
  'flapOverlap',
] as const;
type CalcField = (typeof CALC_FIELDS)[number];

/**
 * The numeric subset the endpoint actually RETURNS (`ProductCalculateResult`)
 * — `additionalSheetLength`/`flap`/`flapOverlap` are context-only inputs, so
 * applying `result[key]` back for them would be indexing a key the response
 * never carries (D-5).
 */
const CALC_RESULT_FIELDS = [
  'boxLength',
  'boxWidth',
  'boxHeight',
  'externalLength',
  'externalWidth',
  'externalHeight',
  'boxSurface',
  'grammage',
  'sheetLength',
  'sheetWidth',
  'lowerFlap',
  'upperFlap',
] as const;

/** Score-line context/result fields — text, not numbers (D-5). */
const CALC_TEXT_FIELDS = ['corrugationScoreLines', 'printScoreLines'] as const;

/** `field`s that trigger a calculate call (D-4: dimension/surface/grammage + model/flap/rotation). */
type CalcTriggerField =
  | 'boxSurface'
  | 'grammage'
  | 'externalLength'
  | 'externalWidth'
  | 'externalHeight'
  | 'flap'
  | 'mandatoryRotation'
  | 'model';

const toCalcNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Which tab owns each registered field — drives the "jump to the first tab
 * with an error" requirement (AC-14) for both client (zod) and server
 * (field-level 400) errors, since both land in `formState.errors` the same
 * way (`useModalForm`'s `applyServerFieldErrors`).
 */
const FIELD_TAB: Partial<Record<keyof CreateProductForm, TabKey>> = {
  code: 'general',
  clientCode: 'general',
  customerId: 'general',
  description: 'general',
  revision: 'general',
  vip: 'general',

  corrugationUuid: 'production',
  modelUuid: 'production',
  flapTypeUuid: 'production',
  glueTypeUuid: 'production',
  complementUuid: 'production',
  boxLength: 'production',
  boxWidth: 'production',
  boxHeight: 'production',
  externalLength: 'production',
  externalWidth: 'production',
  externalHeight: 'production',
  sheetLength: 'production',
  sheetWidth: 'production',
  additionalSheetLength: 'production',
  flap: 'production',
  lowerFlap: 'production',
  upperFlap: 'production',
  flapOverlap: 'production',
  corrugationScoreLines: 'production',
  printScoreLines: 'production',
  symmetricScoreLines: 'production',
  colorCount: 'production',
  printSides: 'production',
  inks: 'production',
  grammage: 'production',

  productionRouteUuid: 'route',

  palletizationUuid: 'palletizing',
  strappingTypeUuid: 'palletizing',
  traceTypeUuid: 'palletizing',
  preferredWidth: 'palletizing',
  labelsPerPallet: 'palletizing',
  labelText: 'palletizing',
  printCode: 'palletizing',
  printDate: 'palletizing',
  printRecyclable: 'palletizing',
  printWarranty: 'palletizing',
  printLogo: 'palletizing',
  printNationalIndustry: 'palletizing',
  printExport: 'palletizing',
  compressionTest: 'palletizing',
  burstTest: 'palletizing',
  cobbTest: 'palletizing',
  ect: 'palletizing',
  lengthUpperTolerance: 'palletizing',
  lengthLowerTolerance: 'palletizing',
  widthUpperTolerance: 'palletizing',
  widthLowerTolerance: 'palletizing',
  overrunPercentage: 'palletizing',
  underrunPercentage: 'palletizing',
  corrugationOverproduction: 'palletizing',
  allowsRotation: 'palletizing',
  allowsPartialRotation: 'palletizing',
  mandatoryRotation: 'palletizing',
  averageWeight: 'palletizing',
  allowsGluing: 'palletizing',
  claspClosure: 'palletizing',
  associatedQuantity: 'palletizing',
  foodSafetyNumber: 'palletizing',
  blueprintRef: 'palletizing',
  notes: 'palletizing',
  quotingNotes: 'palletizing',
};

const EMPTY_OPTIONS: ProductFormOptions = {
  customers: [],
  corrugations: [],
  models: [],
  flapTypes: [],
  glueTypes: [],
  strappingTypes: [],
  traceTypes: [],
  complements: [],
  palletizations: [],
  globalRoutes: [],
};

const optionsOf = <T extends { uuid: string }>(
  items: T[],
  label: (item: T) => string,
): Options[] => items.map((item) => ({ uuid: item.uuid, label: label(item) }));

const productToForm = (p: Product): Partial<CreateProductForm> => ({
  code: p.code,
  clientCode: p.clientCode ?? undefined,
  description: p.description ?? undefined,
  customerId: p.customer?.uuid ?? '',
  revision: p.revision ?? 0,
  vip: p.vip ?? false,

  corrugationUuid: p.corrugation?.uuid ?? undefined,
  modelUuid: p.model?.uuid ?? undefined,
  productionRouteUuid: p.productionRoute?.uuid ?? undefined,
  palletizationUuid: p.palletization?.uuid ?? undefined,
  flapTypeUuid: p.flapType?.uuid ?? undefined,
  glueTypeUuid: p.glueType?.uuid ?? undefined,
  strappingTypeUuid: p.strappingType?.uuid ?? undefined,
  traceTypeUuid: p.traceType?.uuid ?? undefined,
  complementUuid: p.complement?.uuid ?? undefined,

  boxLength: p.boxLength ?? undefined,
  boxWidth: p.boxWidth ?? undefined,
  boxHeight: p.boxHeight ?? undefined,
  externalLength: p.externalLength ?? undefined,
  externalWidth: p.externalWidth ?? undefined,
  externalHeight: p.externalHeight ?? undefined,
  sheetLength: p.sheetLength ?? undefined,
  sheetWidth: p.sheetWidth ?? undefined,
  additionalSheetLength: p.additionalSheetLength ?? undefined,
  preferredWidth: p.preferredWidth ?? undefined,
  flap: p.flap ?? undefined,
  lowerFlap: p.lowerFlap ?? undefined,
  upperFlap: p.upperFlap ?? undefined,
  flapOverlap: p.flapOverlap ?? undefined,
  corrugationScoreLines: p.corrugationScoreLines ?? undefined,
  printScoreLines: p.printScoreLines ?? undefined,
  symmetricScoreLines: p.symmetricScoreLines ?? false,
  colorCount: p.colorCount ?? undefined,
  printSides: p.printSides ?? undefined,
  inks: p.inks ?? undefined,
  labelsPerPallet: p.labelsPerPallet ?? undefined,
  labelText: p.labelText ?? undefined,
  printCode: p.printCode ?? false,
  printDate: p.printDate ?? false,
  printRecyclable: p.printRecyclable ?? false,
  printWarranty: p.printWarranty ?? false,
  printLogo: p.printLogo ?? false,
  printNationalIndustry: p.printNationalIndustry ?? false,
  printExport: p.printExport ?? false,
  compressionTest: p.compressionTest ?? undefined,
  burstTest: p.burstTest ?? undefined,
  cobbTest: p.cobbTest ?? undefined,
  ect: p.ect ?? undefined,
  grammage: p.grammage ?? undefined,
  lengthUpperTolerance: p.lengthUpperTolerance ?? undefined,
  lengthLowerTolerance: p.lengthLowerTolerance ?? undefined,
  widthUpperTolerance: p.widthUpperTolerance ?? undefined,
  widthLowerTolerance: p.widthLowerTolerance ?? undefined,
  overrunPercentage: p.overrunPercentage ?? undefined,
  underrunPercentage: p.underrunPercentage ?? undefined,
  corrugationOverproduction: p.corrugationOverproduction ?? undefined,
  allowsRotation: p.allowsRotation ?? false,
  allowsPartialRotation: p.allowsPartialRotation ?? false,
  mandatoryRotation: p.mandatoryRotation ?? false,
  boxSurface: p.boxSurface ?? undefined,
  averageWeight: p.averageWeight ?? undefined,
  allowsGluing: p.allowsGluing ?? false,
  claspClosure: p.claspClosure ?? undefined,
  associatedQuantity: p.associatedQuantity ?? undefined,
  foodSafetyNumber: p.foodSafetyNumber ?? undefined,
  blueprintRef: p.blueprintRef ?? undefined,
  notes: p.notes ?? undefined,
  quotingNotes: p.quotingNotes ?? undefined,
});

const EMPTY_FORM: Partial<CreateProductForm> = {
  revision: 0,
  vip: false,
  symmetricScoreLines: false,
  printCode: false,
  printDate: false,
  printRecyclable: false,
  printWarranty: false,
  printLogo: false,
  printNationalIndustry: false,
  printExport: false,
  allowsRotation: false,
  allowsPartialRotation: false,
  mandatoryRotation: false,
  allowsGluing: false,
};

const CLEARABLE_REFS = [
  'modelUuid',
  'palletizationUuid',
  'flapTypeUuid',
  'glueTypeUuid',
  'strappingTypeUuid',
  'traceTypeUuid',
  'complementUuid',
] as const;

/**
 * An empty <select> submits "". Optional references go out as null (clears
 * them); corrugation and route cannot be cleared on PUT (model.md), so an
 * empty value is omitted and the API keeps — or on create, assigns — them.
 */
const normalizeRefs = (data: CreateProductForm): CreateProductForm => {
  const out: CreateProductForm = { ...data };
  for (const key of CLEARABLE_REFS) {
    if (out[key] === '') out[key] = null;
  }
  if (out.corrugationUuid === '') delete out.corrugationUuid;
  if (out.productionRouteUuid === '') delete out.productionRouteUuid;
  return out;
};

const EMPTY_FILE_UUIDS: FileUuids = {
  technicalSheetFileUuid: null,
  blueprintFileUuid: null,
  sketchFileUuid: null,
  imageFileUuid: null,
};

const approvalBadge = (
  status: ProductApprovalStatus,
  t: (key: string, opts?: Record<string, unknown>) => string,
  product: Product | null,
) => {
  const classes =
    status === 'approved'
      ? 'gd-badge-positive'
      : status === 'cancelled'
        ? 'gd-badge-negative'
        : 'gd-badge-warning';
  const text =
    status === 'approved'
      ? t('products.approval.approved', {
          user: product?.productApprovalBy ?? '',
          date: product?.productApprovalAt ? new Date(product.productApprovalAt).toLocaleString() : '',
        })
      : status === 'cancelled'
        ? t('products.approval.cancelled', {
            user: product?.productCancellationBy ?? '',
            date: product?.productCancellationAt ? new Date(product.productCancellationAt).toLocaleString() : '',
          })
        : t('products.approval.pending');
  return (
    <span className={`gd-badge ${classes}`}>
      {text}
    </span>
  );
};

/**
 * One 4-tab modal for create AND edit (D-26): "1. Datos Generales & Archivos",
 * "2. Datos de Producción", "3. Ruta de Producción & Insumos",
 * "4. Palletizado & Obs." (mockup order). One "Guardar Producto" issues
 * exactly one `createProduct`/`updateProduct` call with the flat body.
 */
const ProductFormModal: React.FC<Props> = ({ mode, isOpen, onClose, onSuccess, product }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const isEdit = mode === 'edit';

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [options, setOptions] = useState<ProductFormOptions>(EMPTY_OPTIONS);
  const [fileUuids, setFileUuids] = useState<FileUuids>(EMPTY_FILE_UUIDS);
  const [current, setCurrent] = useState<Product | null>(product);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [effectiveGrammage, setEffectiveGrammage] = useState<number | null>(null);
  /** Read-only (I-6/I-8): never part of `CreateProductForm`, never submitted by hand. */
  const [boxWeight, setBoxWeight] = useState<number | null>(null);
  const calcSeqRef = useRef(0);
  /** Last value each cascade field was calculated from — a blur without an edit recalculates nothing. */
  const calcBaselineRef = useRef<Partial<Record<CalcField, number | null>>>({});
  /** Same changed-value guard for the two non-numeric triggers (D-4). */
  const mandatoryRotationBaselineRef = useRef<boolean>(false);
  const modelBaselineRef = useRef<string | null>(null);
  const pendingCalcRef = useRef<Promise<void> | null>(null);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      reset,
      watch,
      setValue,
      getValues,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateProductForm>({
    onSuccess,
    onClose,
    schema: productSchema(t),
  });

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('general');
    setCalcError(null);
    setCurrent(product);
    setBoxWeight(product?.boxWeight ?? null);
    setEffectiveGrammage(product?.effectiveGrammage ?? null);
    const initial = product ? productToForm(product) : EMPTY_FORM;
    reset(initial);
    calcBaselineRef.current = Object.fromEntries(
      CALC_FIELDS.map((key) => [key, toCalcNumber(initial[key])]),
    );
    mandatoryRotationBaselineRef.current = initial.mandatoryRotation ?? false;
    modelBaselineRef.current = initial.modelUuid ?? null;
    pendingCalcRef.current = null;
    setFileUuids(
      product
        ? {
            technicalSheetFileUuid: product.technicalSheetFileUuid ?? null,
            blueprintFileUuid: product.blueprintFileUuid ?? null,
            sketchFileUuid: product.sketchFileUuid ?? null,
            imageFileUuid: product.imageFileUuid ?? null,
          }
        : EMPTY_FILE_UUIDS,
    );

    const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
    (async () => {
      try {
        const [customers, corrugations, models, flapTypes, glueTypes, strappingTypes, traceTypes, complements, palletizations, globalRoutes] =
          await Promise.all([
            customersApi.getCustomers({ limit: 100, ...companyFilter }),
            corrugationsApi.getCorrugations({ limit: 100, ...companyFilter }),
            modelsApi.getModels({ limit: 100, ...companyFilter }),
            flapTypesApi.getFlapTypes({ limit: 100, ...companyFilter }),
            glueTypesApi.getGlueTypes({ limit: 100, ...companyFilter }),
            strappingTypesApi.getStrappingTypes({ limit: 100, ...companyFilter }),
            traceTypesApi.getTraceTypes({ limit: 100, ...companyFilter }),
            complementsApi.getComplements({ limit: 100, ...companyFilter }),
            palletizationsApi.getPalletizations({ limit: 100, ...companyFilter }),
            productionRoutesApi.getRoutes({ limit: 100, isGlobal: 'true', ...companyFilter }),
          ]);
        setOptions({
          customers: optionsOf<Customer>(customers.data, (c) => c.name),
          corrugations: optionsOf<Corrugation>(corrugations.data, (c) => c.code),
          models: optionsOf<Model>(models.data, (m) => [m.code, m.description].filter(Boolean).join(' - ')),
          flapTypes: optionsOf<FlapType>(flapTypes.data, (f) => f.code),
          glueTypes: optionsOf<GlueType>(glueTypes.data, (g) => g.code),
          strappingTypes: optionsOf<StrappingType>(strappingTypes.data, (s) => s.code),
          traceTypes: optionsOf<TraceType>(traceTypes.data, (tt) => tt.code),
          complements: optionsOf<Complement>(complements.data, (c) => c.code),
          palletizations: optionsOf<Palletization>(palletizations.data, (p) => p.name ?? p.code ?? ''),
          globalRoutes: optionsOf<ProductionRoute>(globalRoutes.data, (r) => r.name),
        });
      } catch (err) {
        logger.error('Error loading product form options:', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, effectiveCompanyId]);

  /** Jumps to the first tab holding an error — client (zod) or server field. */
  useEffect(() => {
    const firstErrorField = (Object.keys(errors) as Array<keyof CreateProductForm>).find(
      (key) => FIELD_TAB[key],
    );
    if (firstErrorField) setActiveTab(FIELD_TAB[firstErrorField] as TabKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const runCalculate = useCallback(
    async (field: CalcTriggerField, value: number | boolean | null) => {
      const modelUuid = getValues('modelUuid') || null;
      if (field === 'mandatoryRotation') {
        if (mandatoryRotationBaselineRef.current === value) return;
      } else if (field === 'model') {
        if (modelBaselineRef.current === modelUuid) return;
      } else if (calcBaselineRef.current[field] === value) {
        return;
      }
      const corrugationUuid = getValues('corrugationUuid');
      if (!corrugationUuid) {
        setCalcError(t('products.calculate.corrugationRequired'));
        return;
      }
      const seq = ++calcSeqRef.current;
      setCalculating(true);
      setCalcError(null);
      try {
        const values = getValues();
        const result = await productsApi.calculate({
          corrugationUuid,
          modelUuid,
          field,
          value: field === 'model' ? null : value,
          values: {
            ...Object.fromEntries(CALC_FIELDS.map((key) => [key, toCalcNumber(values[key])])),
            ...Object.fromEntries(CALC_TEXT_FIELDS.map((key) => [key, values[key] ?? null])),
            mandatoryRotation: values.mandatoryRotation ?? false,
            boxWeight: null,
          },
        });
        if (seq !== calcSeqRef.current) return;
        CALC_RESULT_FIELDS.forEach((key) => {
          const next = result[key];
          if (next === undefined) return;
          setValue(key, next ?? undefined, { shouldDirty: true });
          calcBaselineRef.current[key] = next ?? null;
        });
        // Not echoed back by the endpoint (D-5) — the guard tracks what was sent.
        calcBaselineRef.current.flap = toCalcNumber(values.flap);
        CALC_TEXT_FIELDS.forEach((key) => {
          const next = result[key];
          if (next === undefined) return;
          setValue(key, next ?? undefined, { shouldDirty: true });
        });
        setBoxWeight(result.boxWeight ?? null);
        setEffectiveGrammage(result.effectiveGrammage ?? null);
        mandatoryRotationBaselineRef.current = values.mandatoryRotation ?? false;
        modelBaselineRef.current = modelUuid;
      } catch (err: any) {
        if (seq !== calcSeqRef.current) return;
        logger.error('Product calculate failed:', err);
        setCalcError(err?.response?.data?.message ?? t('products.calculate.error'));
      } finally {
        if (seq === calcSeqRef.current) setCalculating(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getValues, setValue, t],
  );

  const triggerCalculate = useCallback(
    (field: CalcTriggerField, value: number | boolean | null) => {
      const pending = runCalculate(field, value);
      pendingCalcRef.current = pending;
      pending.finally(() => {
        if (pendingCalcRef.current === pending) pendingCalcRef.current = null;
      });
    },
    [runCalculate],
  );

  /**
   * The mandatory-rotation toggle lives on tab 4 (`ProductPalletizingTab`,
   * out of this card's scope) — subscribed here instead of an onChange prop
   * so this file stays the only one wiring the calculate triggers (D-4).
   * Callback-style `watch` hands back the live, just-committed values on
   * every change (including `reset()`'s), unlike `watch('mandatoryRotation')`
   * as a hook return value, whose render-time closure goes stale the instant
   * `reset()` fires. The same changed-value guard as every other trigger
   * (inside `runCalculate`) is what keeps `reset()` itself a no-op here.
   */
  useEffect(() => {
    const subscription = watch((values) => {
      triggerCalculate('mandatoryRotation', values.mandatoryRotation ?? false);
    });
    return () => subscription.unsubscribe();
  }, [watch, triggerCalculate]);

  const onSubmit = handleSubmit(async (submitted) => {
    // Clicking "Guardar" blurs the field being edited, which starts a
    // calculation; the save must carry its results, not the pre-blur values.
    let data = submitted;
    if (pendingCalcRef.current) {
      await pendingCalcRef.current;
      const latest = getValues();
      data = {
        ...submitted,
        ...Object.fromEntries(CALC_FIELDS.map((key) => [key, latest[key]])),
        ...Object.fromEntries(CALC_TEXT_FIELDS.map((key) => [key, latest[key]])),
      };
    }
    const payload: CreateProductForm = {
      ...normalizeRefs(data),
      ...fileUuids,
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    if (isEdit && current) {
      const updated = await productsApi.updateProduct(current.uuid, payload);
      setCurrent(updated);
      return updated;
    }
    return productsApi.createProduct(payload);
  });

  const tabHasError = (key: TabKey) =>
    (Object.keys(errors) as Array<keyof CreateProductForm>).some((field) => FIELD_TAB[field] === key);

  const tabs: TabItem[] = [
    {
      key: 'general',
      label: t('products.tabs.general'),
      hasError: tabHasError('general'),
      content: (
        <ProductGeneralTab
          register={register}
          errors={errors}
          options={options}
          fileUuids={fileUuids}
          onFileUuidsChange={setFileUuids}
          isEdit={isEdit}
          current={current}
          onApprovalChanged={setCurrent}
        />
      ),
    },
    {
      key: 'production',
      label: t('products.tabs.production'),
      hasError: tabHasError('production'),
      content: (
        <ProductProductionTab
          register={register}
          errors={errors}
          watch={watch}
          options={options}
          onOuterDimBlur={triggerCalculate}
          onModelChange={() => triggerCalculate('model', null)}
          calcError={calcError}
          calculating={calculating}
          effectiveGrammage={effectiveGrammage}
          boxWeight={boxWeight}
        />
      ),
    },
    {
      key: 'route',
      label: t('products.tabs.route'),
      hasError: tabHasError('route'),
      content: (
        <ProductRouteTab
          register={register}
          watch={watch}
          options={options}
          current={current}
        />
      ),
    },
    {
      key: 'palletizing',
      label: t('products.tabs.palletizing'),
      hasError: tabHasError('palletizing'),
      content: (
        <ProductPalletizingTab register={register} errors={errors} options={options} />
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? t('products.editTitle') : t('products.createTitle')}
      size="2xl"
    >
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Tabs
          idPrefix="product-form"
          tabs={tabs}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          errorLabel={t('products.form.tabHasError') ?? undefined}
        />

        <div className="flex items-center justify-between border-t border-secondary-200 pt-4">
          <div>{approvalBadge(current?.approvalStatus ?? 'pending', t, current)}</div>
          <ModalFooter
            loading={loading}
            onCancel={handleClose}
            submitText={t('products.saveButton')}
            className="pt-0"
          />
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;

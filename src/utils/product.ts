export type Product = 'full' | 'lite';

export const PRODUCT_LABEL: Record<Product, string> = {
  full: 'Mobius',
  lite: 'Mobius Lite',
};

/** Build-time: the same source is deployed as both products' web app. */
export const isLiteBuild = (): boolean => process.env.REACT_APP_PRODUCT === 'lite';

export const applyProductTitle = (): void => {
  if (isLiteBuild()) document.title = PRODUCT_LABEL.lite;
};

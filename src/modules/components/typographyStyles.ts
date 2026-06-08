import React from 'react';

export const getTypographyStyle = (typeStyle: string): React.CSSProperties => ({
  fontFamily: `var(--recursica_brand_typography_${typeStyle}-font-family)`,
  fontSize: `var(--recursica_brand_typography_${typeStyle}-font-size)`,
  fontWeight: `var(--recursica_brand_typography_${typeStyle}-font-weight)`,
  letterSpacing: `var(--recursica_brand_typography_${typeStyle}-font-letter-spacing)`,
  lineHeight: `var(--recursica_brand_typography_${typeStyle}-line-height)`,
  margin: 0,
});

export const h1Style = getTypographyStyle('h1');
export const h2Style = getTypographyStyle('h2');
export const h3Style = getTypographyStyle('h3');
export const pStyle = getTypographyStyle('body');
export const pSmallStyle = getTypographyStyle('body-small');

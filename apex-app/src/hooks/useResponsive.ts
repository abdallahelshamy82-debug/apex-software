import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  containerWidth: number | string;
  paddingHorizontal: number;
  gridColumns: number;
  headerFontSize: number;
  bodyFontSize: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  let containerWidth: number | string = '100%';
  let paddingHorizontal = 16;
  let gridColumns = 1;

  if (isDesktop) {
    containerWidth = 1140;
    paddingHorizontal = 32;
    gridColumns = 3;
  } else if (isTablet) {
    containerWidth = 820;
    paddingHorizontal = 24;
    gridColumns = 2;
  } else {
    containerWidth = '100%';
    paddingHorizontal = 16;
    gridColumns = 1;
  }

  const headerFontSize = isMobile ? 24 : isTablet ? 30 : 36;
  const bodyFontSize = isMobile ? 14 : 15;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    containerWidth,
    paddingHorizontal,
    gridColumns,
    headerFontSize,
    bodyFontSize,
  };
}

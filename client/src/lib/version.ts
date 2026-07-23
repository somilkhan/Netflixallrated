/// <reference types="vite/client" />

const getBuildValue = (value: string | undefined): string =>
  value?.trim() || 'dev';

export const BUILD_INFO = {
  sha: getBuildValue(import.meta.env.VITE_GIT_SHA),
  date: getBuildValue(import.meta.env.VITE_BUILD_DATE),
  branch: getBuildValue(import.meta.env.VITE_GIT_BRANCH),
} as const;
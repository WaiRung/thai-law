import { ref } from 'vue';

// Shared state for header title and subtitle
const appTitle = ref('Thai Law');
const appSubtitle = ref('Thai Law');

export function useHeader() {
  const setHeader = (title: string, subtitle: string) => {
    appTitle.value = title;
    appSubtitle.value = subtitle;
  };

  const resetHeader = () => {
    appTitle.value = 'Thai Law';
    appSubtitle.value = 'Thai Law';
  };

  return {
    appTitle,
    appSubtitle,
    setHeader,
    resetHeader,
  };
}

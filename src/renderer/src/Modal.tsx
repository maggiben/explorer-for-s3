import '@renderer/assets/styles/Modal.css';
// import i18n from '@utils/i18n';
// import { I18nextProvider } from 'react-i18next';
import { Provider as JotaiProvider } from 'jotai';
import { ISettings } from 'src/types/ISettings';
// import { preferencesState } from '@states/atoms';

// Global style to set the background color of the body

export default function Modal({ settings }: { settings?: ISettings; ts?: number }) {
  return (
    <JotaiProvider>
      {/* <I18nextProvider i18n={i18n}> */}
      <pre>{JSON.stringify(settings, null, 2)}</pre>
      {/* </I18nextProvider> */}
    </JotaiProvider>
  );
}

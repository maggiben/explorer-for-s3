import '@renderer/assets/styles/Modal.css';
// import i18n from '@utils/i18n';
// import { I18nextProvider } from 'react-i18next';
import Providers from './Providers';
import type { ISettings } from '../../types/ISettings';

export default function Modal({ settings }: { settings?: ISettings; ts?: number }) {
  return (
    <Providers settings={settings}>
      {/* <I18nextProvider i18n={i18n}> */}
      <pre>{JSON.stringify(settings, null, 2)}</pre>
      {/* </I18nextProvider> */}
    </Providers>
  );
}

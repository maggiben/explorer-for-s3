// import Versions from './components/Versions';
// import electronLogo from './assets/electron.svg';
import Layout from './Layout';
import Providers from './Providers';

function App({ settings }: { settings: Record<string, unknown> }): React.JSX.Element {
  return (
    <Providers settings={settings}>
      <Layout>
        <span>Hello</span>
      </Layout>
    </Providers>
  );
}

export default App;

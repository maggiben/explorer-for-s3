// import Versions from './components/Versions';
// import electronLogo from './assets/electron.svg';
import Layout from './Layout';
import Providers from './Providers';
import NewBucket from './components/NewBucket';
import Welcome from './components/Welcome';

function App(): React.JSX.Element {
  return (
    <Providers>
      <Layout>
        <NewBucket />
      </Layout>
    </Providers>
  );
}

export default App;

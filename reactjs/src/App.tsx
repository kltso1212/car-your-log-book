import './App.css';
import Main from './Main';
import Header from './Header';
import Footer from './Footer';
import ImageViewer from './components/ImageViewer';

export default function App() {
  return (
    <div className="App">
      <ImageViewer>
        <Header />
        <Main />
        <Footer />
      </ImageViewer>
    </div>
  );
}

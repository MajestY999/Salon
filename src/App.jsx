import { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Services from './components/Services';
import Team from './components/Team';
import BookingForm from './components/Booking';
import Contacts from './components/ContactMap';
import Admin from './components/Admin';
import Footer from './components/Footer';
import Header from './components/Header';

function App() {
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const onChange = () => forceUpdate(n => n + 1);
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

const isAdminRoute = (() => {
  const { pathname, hash } = window.location;
  const byPath = pathname.endsWith('/admin') || pathname.endsWith('/admin/');
  const byHash = hash === '#admin' || hash === '#/admin';
  return byPath || byHash;
})();

  if (isAdminRoute) {
    return <Admin />;
  }

  return (
    <div className="bg-violet-50">
      <Hero />
      <Services />
      <Team />
      <Header />
      <BookingForm />
      <Contacts />
      <Footer />
    </div>
  );
}

export default App;
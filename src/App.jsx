
import Hero from './components/Hero';
import Services from './components/Services';
import Team from './components/Team';
import BookingForm from './components/Booking';
import Contacts from './components/ContactMap';
import Admin from './components/Admin';
import Footer from './components/Footer';
import Header from './components/Header';


function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/admin';

  if (isAdminRoute) {
    // отдельный рендер админ-панели по /admin
    return <Admin />;
  }

  // обычный сайт для клиентов
  return (
    <div className="bg-violet-50">
      <Hero />
      <Services />
      <Team />
      <Header/>
      <BookingForm />
      <Contacts />
      <Footer />
      {/* Admin не показываем на клиентских маршрутах */}
    </div>
  );
}  


export default App;

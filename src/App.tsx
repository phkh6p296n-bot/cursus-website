import { Booking } from './components/Booking';
import { Compare } from './components/Compare';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { LiveMap } from './components/livemap/LiveMap';
import { Nav } from './components/Nav';
import { PartLoads } from './components/PartLoads';
import { Pilot } from './components/Pilot';
import { Problem } from './components/Problem';
import { Roi } from './components/Roi';
import { Team } from './components/Team';

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Compare />
        <HowItWorks />
        <LiveMap />
        <PartLoads />
        <Roi />
        <Pilot />
        <Team />
        <Faq />
        <Booking />
      </main>
      <Footer />
    </>
  );
}

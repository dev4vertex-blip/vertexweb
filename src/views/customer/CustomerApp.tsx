import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { CustomerHome } from './CustomerHome';
import { CustomerServices } from './CustomerServices';
import { CustomerServiceDetails } from './CustomerServiceDetails';
import { CustomerBookService } from './CustomerBookService';
import { CustomerBookingConfirmation } from './CustomerBookingConfirmation';
import { CustomerMyBookings } from './CustomerMyBookings';
import { CustomerBookingDetails } from './CustomerBookingDetails';
import { CustomerAMC } from './CustomerAMC';
import { CustomerProfile } from './CustomerProfile';
import { CustomerAddresses } from './CustomerAddresses';
import { CustomerNotifications } from './CustomerNotifications';
import { CustomerSupport } from './CustomerSupport';
import { ServiceItem, Booking } from '../../types';
import { CITIES } from '../../data/mockData';
import {
  Home,
  Wrench,
  CalendarCheck,
  Shield,
  User,
  MapPin,
  Bell,
  ChevronDown,
} from 'lucide-react';

export type CustomerScreen =
  | 'home'
  | 'services'
  | 'service-details'
  | 'book-service'
  | 'booking-confirmation'
  | 'my-bookings'
  | 'booking-details'
  | 'amc'
  | 'profile'
  | 'addresses'
  | 'notifications'
  | 'support';

export const CustomerApp: React.FC = () => {
  const {
    currentCustomer,
    selectedCity,
    setSelectedCity,
    notifications,
  } = useApp();

  const [currentScreen, setCurrentScreen] = useState<CustomerScreen>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | undefined>();
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigateTo = (screen: CustomerScreen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectService = (service: ServiceItem) => {
    setActiveService(service);
    navigateTo('service-details');
  };

  const handleQuickBook = (service: ServiceItem) => {
    setActiveService(service);
    navigateTo('book-service');
  };

  const handleBookingCreated = (booking: Booking) => {
    setActiveBooking(booking);
    navigateTo('booking-confirmation');
  };

  const handleSelectBooking = (booking: Booking) => {
    setActiveBooking(booking);
    navigateTo('booking-details');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Customer Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 sm:top-[33px] z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('home')}
              className="text-left cursor-pointer focus:outline-none"
            >
              <VertexLogo size="sm" />
            </button>

            {/* City Selector */}
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent font-semibold text-xs text-slate-900 focus:outline-none cursor-pointer pr-4"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications button */}
            <button
              onClick={() => navigateTo('notifications')}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Customer mini profile */}
            <button
              onClick={() => navigateTo('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {currentCustomer.name[0]}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                {currentCustomer.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
        {currentScreen === 'home' && (
          <CustomerHome
            onNavigateToServices={(catId) => {
              setSelectedCategoryFilter(catId);
              navigateTo('services');
            }}
            onSelectService={handleSelectService}
            onNavigateToAMC={() => navigateTo('amc')}
            onNavigateToBookings={() => navigateTo('my-bookings')}
          />
        )}

        {currentScreen === 'services' && (
          <CustomerServices
            initialCategoryId={selectedCategoryFilter}
            onSelectService={handleSelectService}
            onQuickBook={handleQuickBook}
          />
        )}

        {currentScreen === 'service-details' && activeService && (
          <CustomerServiceDetails
            service={activeService}
            onBack={() => navigateTo('services')}
            onBookNow={(s) => {
              setActiveService(s);
              navigateTo('book-service');
            }}
          />
        )}

        {currentScreen === 'book-service' && activeService && (
          <CustomerBookService
            service={activeService}
            onBack={() => navigateTo('service-details')}
            onBookingComplete={handleBookingCreated}
            onAddNewAddress={() => navigateTo('addresses')}
          />
        )}

        {currentScreen === 'booking-confirmation' && activeBooking && (
          <CustomerBookingConfirmation
            booking={activeBooking}
            onGoHome={() => navigateTo('home')}
            onGoToBookings={() => navigateTo('my-bookings')}
            onViewBookingDetails={(b) => {
              setActiveBooking(b);
              navigateTo('booking-details');
            }}
          />
        )}

        {currentScreen === 'my-bookings' && (
          <CustomerMyBookings
            onSelectBooking={handleSelectBooking}
            onExploreServices={() => navigateTo('services')}
          />
        )}

        {currentScreen === 'booking-details' && activeBooking && (
          <CustomerBookingDetails
            booking={activeBooking}
            onBack={() => navigateTo('my-bookings')}
            onSupportClick={() => navigateTo('support')}
          />
        )}

        {currentScreen === 'amc' && <CustomerAMC />}

        {currentScreen === 'profile' && (
          <CustomerProfile
            onNavigateToAddresses={() => navigateTo('addresses')}
            onNavigateToAMC={() => navigateTo('amc')}
            onNavigateToNotifications={() => navigateTo('notifications')}
            onNavigateToSupport={() => navigateTo('support')}
          />
        )}

        {currentScreen === 'addresses' && <CustomerAddresses />}

        {currentScreen === 'notifications' && <CustomerNotifications />}

        {currentScreen === 'support' && <CustomerSupport />}
      </main>

      {/* Customer Bottom Navigation Bar (Responsive fixed bottom bar) */}
      <nav
        aria-label="Customer navigation"
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 z-40 shadow-lg sm:max-w-md sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:rounded-2xl sm:border"
      >
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigateTo('home')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'home'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategoryFilter(undefined);
              navigateTo('services');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'services' || currentScreen === 'service-details'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>Services</span>
          </button>

          <button
            onClick={() => navigateTo('my-bookings')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'my-bookings' ||
              currentScreen === 'booking-details' ||
              currentScreen === 'booking-confirmation'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-5 h-5 mb-0.5" />
            <span>Bookings</span>
          </button>

          <button
            onClick={() => navigateTo('amc')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'amc'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span>AMC</span>
          </button>

          <button
            onClick={() => navigateTo('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'profile' ||
              currentScreen === 'addresses' ||
              currentScreen === 'notifications' ||
              currentScreen === 'support'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

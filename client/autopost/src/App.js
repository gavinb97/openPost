import './App.css';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import UploadScreen from './screens/UploadScreen';
import SocialsLoginScreen from './screens/SocialsLoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import UserLandingScreen from './screens/UserLandingScreen';
import About from './screens/About';
import Jobs from './screens/Jobs';
import Profile from './screens/Profile';
import Navbar from './components/Navbar';
import { AuthProvider } from './service/authContext';
import PrivacyToS from './screens/PrivacyToS'
import ContactSupport from './screens/ContactSupport';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomeScreen />
    },
    {
      path: '/privacyTos',
      element: <PrivacyToS />
    },
    {
      path: '/contact',
      element: <ContactSupport />
    },
    {
      path: '/registration',
      element: <RegistrationScreen />
    },
    {
      path: '/login',
      element: <LoginScreen />
    },
    {
      path: '/uploadMedia',
      element: <UploadScreen />
    },
    {
      path: '/authorizeSocials',
      element: <SocialsLoginScreen />
    },
    {
      path: '/jobscheduler',
      element: <UserLandingScreen />
    },
    {
      path: '/jobs',
      element: <Jobs />
    },
    {
      path: '/about',
      element: <About />
    },
    {
      path: '/profile',
      element: <Profile />
    }
  ]);

  return (
       <AuthProvider>
      <RouterProvider router={router}>
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;

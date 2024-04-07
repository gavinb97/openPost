import logo from './logo.svg';
import './App.css';
import React from 'react';
import { createBrowserRouter, RouterProvider, Link  } from 'react-router-dom';
import UploadScreen from './screens/UploadScreen';
import SocialsLoginScreen from './screens/SocialsLoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import UserLandingScreen from './screens/UserLandingScreen';
import Jobs from './screens/Jobs';
import Navbar from './components/Navbar'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomeScreen />
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
      path: '/uploadMedia', // Corrected path with '/'
      element: <UploadScreen />
    },
    {
      path: '/authorizeSocials', // Corrected path with '/'
      element: <SocialsLoginScreen />
    },
    {
      path: '/landing', // Corrected path with '/'
      element: <UserLandingScreen />
    },
    {
      path: '/jobs', // Corrected path with '/'
      element: <Jobs />
    }
  ]);

  return (
    
    <RouterProvider router={router}>
      <div className="App">
        {/* Add any global components here */}
  
       
      </div>
    </RouterProvider>
  );
}

export default App;

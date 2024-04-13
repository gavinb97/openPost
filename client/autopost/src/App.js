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
import About from './screens/About';
import Jobs from './screens/Jobs';
import Navbar from './components/Navbar'
import { AuthProvider } from './service/authContext';

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
    },
    {
      path: '/about',
      element: <About />
    }
  ]);

  return (
    <AuthProvider>
        <RouterProvider router={router}>
            <div className="App">
              {/* Add any global components here */}
  
       
            </div>
        </RouterProvider>
    </AuthProvider>
    
  );
}

export default App;

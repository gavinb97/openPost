import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import ReactDom from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import UploadScreen from './screens/UploadScreen'
import SocialsLoginScreen from './screens/SocialsLoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

function App() {
 
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomeScreen></HomeScreen>
    },
    {
      path: '/registration',
      element: <RegistrationScreen></RegistrationScreen>
    },
    {
      path: '/login',
      element: <LoginScreen></LoginScreen>
    },
    {
      path: 'uploadMedia',
      element: <UploadScreen></UploadScreen>
    },
    {
      path: 'authorizeSocials',
      element: <SocialsLoginScreen></SocialsLoginScreen>
    }
  ])

  ReactDom.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <RouterProvider router={router}></RouterProvider>
    </React.StrictMode>
  )
}


export default App;

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import { Navigate, Route, Routes } from 'react-router-dom';
import DashBoard from './pages/DashBoard';
import LoginButtons from './components/LoginButtons';
import SignupForm from './components/SgnupForm';
import LoginForm from './components/LoginForm';
import { GameContextProvider } from './context/GameContext';
import ErrorPage from './pages/ErrorPage';
import { useAuthContext } from './hooks/useAuthContext';
import ChessBoard from './components/ChessBoard';

function App() {
    const { user } = useAuthContext();
    
    return (
        <div className='App'>
            <Navbar />
            <div className='content'>
                <Routes>
                    <Route path='/' element={!user ? <LandingPage /> : <Navigate to={'/dashboard'}/>} >
                        <Route index element={!user ? <LoginButtons /> : <Navigate to={'/dashboard'}/>} />
                        <Route path='signup' element={!user ? <SignupForm /> : <Navigate to={'/dashboard'}/>} />
                        <Route path='login' element={!user ? <LoginForm /> : <Navigate to={'/dashboard'}/>} />
                    </Route>
                    
                    <Route path='/dashboard'  element={user ? 
                        <GameContextProvider>
                            <DashBoard /> 
                        </GameContextProvider>
                        : 
                        <Navigate to={'/'}/>} 
                    />
                    <Route path='/room' element={ user ? 
                        <GameContextProvider>
                            <ChessBoard  /> 
                        </GameContextProvider>
                        : 
                        <Navigate to={'/'}/> } 
                    />
                    
                    <Route path='/error' element={<ErrorPage />} />
                    <Route path='*' element={<ErrorPage />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;

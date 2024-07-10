// Chess\frontend\src\components\LandingPage.tsx

import { Outlet } from 'react-router-dom';

function LandingPage() {
    return (
        <div className='landing-page-div'>
            <div className='board-image'></div>
            <div>
                <Outlet/>
            </div>
        </div>
    );
}

export default LandingPage;

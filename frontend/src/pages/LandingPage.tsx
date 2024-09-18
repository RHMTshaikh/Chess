// Chess\frontend\src\components\LandingPage.tsx

import { Outlet } from 'react-router-dom';
import { gsap } from "gsap";
import { useGSAP } from '@gsap/react';

function LandingPage() {
    useGSAP(()=>{
        gsap.from(".board-image" , {
            duration: 1,
            x: -700,
            opacity: 0,
            // ease: "power2.out",
        })
    })

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

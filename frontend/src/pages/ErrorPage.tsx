import { useLocation } from 'react-router-dom';

export default function ErrorPage() {
    const location = useLocation();
    const message = location.state?.message || 'An unknown error occurred';

    return (
        <div>
            <h1>Error</h1>
            <p>{message}</p>
        </div>
    );
}

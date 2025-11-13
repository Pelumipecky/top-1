import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import KYCComponent from '../components/dashboard/KYC';
import Head from 'next/head';

export default function KYCPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('activeUser');
        if (!userStr) {
            router.push('/signin');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        } catch (err) {
            console.error('Error parsing user data:', err);
            localStorage.removeItem('activeUser');
            router.push('/signin');
        }
    }, []);

    if (!currentUser) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>KYC Verification</title>
                <meta name="description" content="Complete your KYC verification to enable withdrawals" />
            </Head>
            
            <div className="kyc-page-container">
                <div className="kyc-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1>KYC Verification</h1>
                            <p>Complete your identity verification to enable withdrawals and full account access</p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="back-button"
                        >
                            <i className="icofont-arrow-left"></i>
                            Back
                        </button>
                    </div>
                </div>
                
                <div className="kyc-content">
                    <KYCComponent currentUser={currentUser} />
                </div>
            </div>

            <style jsx>{`
                .kyc-page-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, var(--dark-clr2) 0%, var(--dark-clr3) 100%);
                    padding: 0;
                }

                .kyc-header {
                    background: var(--dark-clr1);
                    border-bottom: 1px solid var(--opac-clr1);
                    padding: 20px 0;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    backdrop-filter: blur(10px);
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .title-section h1 {
                    color: var(--text-clr1);
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                    background: var(--linear-grad2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .title-section p {
                    color: var(--grey-clr);
                    font-size: 0.9rem;
                    margin: 0;
                }

                .back-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 10px 20px;
                    background: transparent;
                    border: 1px solid var(--primary-clr);
                    border-radius: 8px;
                    color: var(--primary-clr);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }

                .back-button:hover {
                    background: var(--primary-clr);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(6, 114, 205, 0.3);
                }

                .kyc-content {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }

                    .title-section h1 {
                        font-size: 1.5rem;
                    }

                    .title-section p {
                        font-size: 0.8rem;
                    }

                    .back-button {
                        align-self: flex-end;
                        padding: 8px 16px;
                        font-size: 0.8rem;
                    }

                    .kyc-content {
                        padding: 20px 15px;
                    }
                }
            `}</style>
        </>
    );
}
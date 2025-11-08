import { useState, useRef, useEffect, useContext } from 'react';
import { motion } from "framer-motion";
import Link from 'next/link';
import Image from 'next/image';
import app, { db } from '../database/firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { themeContext } from '../../providers/ThemeProvider';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Signin = () => {
    const [passwordShow, setPasswordShow] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [verify, setVerify] = useState("Default");
    const inputRef = useRef(null);

    const router = useRouter();
    const ctx = useContext(themeContext);
    const { registerFromPath } = ctx;

    const [toLocaleStorage, setToLocalStorage] = useState({
        email: "",
        password: "",
    });

    const colRef = collection(db, "userlogs");

    const handleVerify = () => {
        if (verify === "Default") {
            setVerify("verifying");
            setTimeout(() => {
                setVerify("verified");
                if (inputRef.current) inputRef.current.checked = true;
            }, 3000);
        } else {
            if (inputRef.current) inputRef.current.checked = true;
        }
    };

    const removeErr = () => {
        setTimeout(() => setErrMsg(""), 3000);
    };

    // Check for existing session on mount
    useEffect(() => {
        const active = JSON.parse(localStorage.getItem("activeUser") || "null");
        if (active?.id) {
            if (active.admin) {
                router.push('/dashboard');
            } else {
                router.push('/profile');
            }
        }
    }, [router]);

    const getSingleDoc = async (e) => {
        try {
            // Validate inputs
            const email = toLocaleStorage.email?.trim();
            const password = toLocaleStorage.password;

            if (!email || !password) {
                setErrMsg("Please enter email and password");
                removeErr();
                return;
            }

                        const auth = getAuth(app);
                        // Sign in via Firebase Auth (secure)
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const authUser = userCredential.user;

            // Try to load the Firestore user record (if any)
            const q = query(colRef, where("email", "==", email));
            const snapshot = await getDocs(q);
            let firestoreUser = null;
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                firestoreUser = { ...doc.data(), id: doc.id };
            }

            const activeUser = {
                // prefer Firestore record, fall back to minimal auth info
                ...(firestoreUser || { name: authUser.displayName || "", email: authUser.email }),
                uid: authUser.uid,
                password: "******",
            };

            // ensure the Firestore doc id is available as `id` when we found a user record
            if (firestoreUser && firestoreUser.id) {
                activeUser.id = firestoreUser.id;
            }

            // Persist activeUser to both localStorage and sessionStorage.
            // `profile.jsx` expects sessionStorage.activeUser during its realtime listener setup.
            localStorage.setItem("activeUser", JSON.stringify(activeUser));
            try {
                sessionStorage.setItem("activeUser", JSON.stringify(activeUser));
            } catch (e) {
                // sessionStorage might be unavailable in some environments; fail silently but log for debugging
                console.warn("Could not write activeUser to sessionStorage:", e);
            }

            if (e?.target) e.target.reset();
            setVerify("Default");

            // Route based on user type
            if (activeUser.admin) {
                router.push('/dashboard');
            } else {
                router.push('/profile');
            }
        } catch (err) {
            console.error("Sign in error:", err);
            // map Firebase errors to user friendly messages when possible
            const message = err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password'
                ? 'Incorrect email or password' : (err.message || 'Sign in failed. Please try again.');
            setErrMsg(message);
            removeErr();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!inputRef.current?.checked) {
            setErrMsg("Please complete the human verification");
            removeErr();
            return;
        }

        getSingleDoc(e);
    };

    return (
        <div className='signupCntn'>
            <Head>
                <title>Sign In</title>
                <meta property="og:title" content="Sign In"/>
            </Head>
            <div className="leftSide">
                <video src="signup_vid2.mp4" autoPlay loop muted></video>
                <div className="overlay">
                    <h2>&quot;Look First -<br /> Then Leap.&quot;</h2>
                    <p><span>--</span>  Alex Hennold  <span>--</span></p>
                </div>
            </div>
            <div className="righside">
                <form onSubmit={handleSubmit}>
                    <Link href={"/"} className='topsignuplink'>
                        <Image src="/topmintLogo.png" alt="logo" width={160} height={40} />
                    </Link>
                    <h1>Sign In with Email</h1>
                    <div className="inputcontainer">
                        <div className="inputCntn">
                            <input 
                                onChange={(e) => setToLocalStorage({...toLocaleStorage, email: e.target.value})}
                                type='email'
                                name='email'
                                placeholder='Email'
                                required
                            />
                            <span><i className="icofont-ui-email"></i></span>
                        </div>
                        <div className="passcntn">
                            <input 
                                onChange={(e) => setToLocalStorage({...toLocaleStorage, password: e.target.value})}
                                type={passwordShow ? "text": "password"}
                                name='password'
                                placeholder='Password'
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setPasswordShow(prev => !prev)}
                            >
                                <i className={`icofont-eye-${!passwordShow? "alt": "blocked"}`}></i>
                            </button>
                        </div>

                        <div className="_cloudflr_verifcation_widget">
                            <div className="verification_Box">
                                <div className="checkbox_cntn" onClick={handleVerify}>
                                    <input ref={inputRef} type="checkbox" />
                                    {verify === "Default" && (
                                        <span aria-hidden="true" className="unchecked"></span>
                                    )}
                                    {verify === "verifying" && (
                                        <i aria-hidden="true" className="icofont-spinner-alt-2"></i>
                                    )}
                                    {verify === "verified" && (
                                        <i aria-hidden="true" className="icofont-check-circled"></i>
                                    )}
                                </div>
                                <div className="verification_status">
                                    {verify === "Default" && <p>Human Verification</p>}
                                    {verify === "verifying" && <p>Verifying...</p>}
                                    {verify === "verified" && <p>Verified</p>}
                                </div>
                            </div>
                            <div className="service_provider">
                                <p>Protected by <Image src="/cloudflare.png" alt="cloudflare" width={120} height={40} /></p>
                            </div>
                        </div>

                        {errMsg && <p className='errorMsg'>{errMsg}</p>}

                        <label className="form-control2">
                            <input type="checkbox" name="checkbox" /> Remember me
                        </label>

                        <button type="submit" className='fancyBtn'>Sign In</button>
                    </div>
                    <p className='haveanaccount'>
                        Are you an admin? <Link href={"/signin_admin"}>Sign In as admin</Link>
                    </p>
                    <p className='haveanaccount'>
                        Don&apos;t have an account? <Link href={"/signup"}>Sign Up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signin;
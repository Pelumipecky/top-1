import { AnimatePresence, motion } from "framer-motion";
import { useState, useContext, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { db } from "../database/firebaseConfig";
import {
  collection,
  where,
  query,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { useRouter } from "next/router";
import DynamicWidget from "../components/dashboard/dynamicWidget";
import { themeContext } from "../../providers/ThemeProvider";
import InvestAdminSect from "../components/dashAdmin/InvestAdminSect";
import UnitInvestSect from "../components/dashAdmin/UnitInvestSect";
import UsersAdmin from "../components/dashAdmin/UsersAdmin";
import UnitUserSect from "../components/dashAdmin/UnitUserSect";
import WithdrawAdmin from "../components/dashAdmin/WithdrawAdmin";
import UnitWithdrawSect from "../components/dashAdmin/UnitWithdrawSect";
import Head from "next/head";
import Image from 'next/image';
import PaymentSect from "../components/dashboard/PaymentSect";
import WithdrawalPayment from "../components/dashboard/WithdrawPayment";
import AdminChat from "../components/ChatBot/AdminChat";
import LoansAdmin from "../components/dashAdmin/LoansAdmin";
import KycAdmin from "../components/dashAdmin/KycAdmin";


export default function DashboardAdmin() {
  // Hooks
  const router = useRouter();
  const { setregisterFromPath } = useContext(themeContext);

  // State declarations
  const [passwordShow, setPasswordShow] = useState(true);
  const [profilestate, setProfileState] = useState("Investments");
  const [bitPrice, setBitPrice] = useState("");
  const [ethPrice, setEthPrice] = useState("");
  const [investments, setInvestments] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // Initialize default state as variables to avoid object literal syntax issues
  const defaultName = "";
  const defaultAvatar = "avatar_1";
  const defaultEmail = "";
  const defaultPassword = "";
  const defaultBalance = 50;
  const defaultDate = new Date().toISOString().split("T")[0];
  const defaultInvestmentCount = 0;
  const defaultReferralCount = 0;
  const defaultAdmin = true;
  const defaultIdnum = "101010";
  const defaultUserName = "Admin";

  // Create default state object using variables
  const defaultUserState = {
    name: defaultName,
    avatar: defaultAvatar,
    email: defaultEmail,
    password: defaultPassword,
    balance: defaultBalance,
    date: defaultDate,
    investmentCount: defaultInvestmentCount,
    referralCount: defaultReferralCount,
    admin: defaultAdmin,
    idnum: defaultIdnum,
    userName: defaultUserName
  };

  const [currentUser, setCurrentUser] = useState(defaultUserState);

  // Function declarations
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/signin_admin");
  };

  // Helper function for fetching price data
  const fetchPriceData = async (url, setterFunction) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      setterFunction(data);
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  };



  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Check local storage first
        const activeUser = JSON.parse(localStorage.getItem("activeUser") || "null");
        const adminData = JSON.parse(localStorage.getItem("adminData") || "null");
        const adminId = localStorage.getItem("adminId");

        // If any required data is missing, redirect to login
        if (!activeUser || !adminData || !adminId || !activeUser.isAdmin) {
          router.replace("/signin_admin");
          return;
        }

        // Verify admin exists in Firestore
        const adminRef = doc(db, "userlogs", adminId);
        const adminDoc = await getDoc(adminRef);

        if (!adminDoc.exists() || !adminDoc.data().admin) {
          localStorage.clear();
          router.replace("/signin_admin");
          return;
        }

        // Everything is valid, update local storage with fresh data
        // Get admin data
        const adminDocData = adminDoc.data();
        const freshAdminData = {
          ...adminDocData,
          id: adminDoc.id,
          isAdmin: true,
          admin: true,
          date: new Date().toISOString().split("T")[0]
        };
        localStorage.setItem("adminData", JSON.stringify(freshAdminData));
        localStorage.setItem("activeUser", JSON.stringify(freshAdminData));
        setCurrentUser(freshAdminData);

      } catch (error) {
        console.error("Admin auth check error:", error);
        localStorage.clear();
        router.replace("/signin_admin");
      }
    };

    let mounted = true;
    
    // Only proceed if component is mounted
    if (mounted) {
      checkAdminAuth();
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [router]);

  // Fetch investments, users, and withdrawals
  useEffect(() => {
    // Fetch investments
    const investmentsQuery = query(collection(db, 'investments'));
    const investmentsSub = onSnapshot(investmentsQuery, (snapshot) => {
      const investmentsData = snapshot.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id
        };
      });
      setInvestments(investmentsData);
    });

    // Fetch users
    const usersQuery = query(collection(db, 'userlogs'));
    const usersSub = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id
        };
      });
      setActiveUsers(usersData);
    });

    // Fetch withdrawals
    const withdrawalsQuery = query(collection(db, 'withdrawals'));
    const withdrawalsSub = onSnapshot(withdrawalsQuery, (snapshot) => {
      const withdrawalsData = snapshot.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id
        };
      });
      setWithdrawals(withdrawalsData);
    });

    // Cleanup subscriptions
    return () => {
      investmentsSub();
      usersSub();
      withdrawalsSub();
    };
  }, []);

  // Check for unread messages
  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('isRead', '==', false),
      where('isAdmin', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessages(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

  // Functions
  const logout = handleLogout;  // Use the same logout function

  // Update currentUser when admin data changes
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "null");
    if (adminData) {
      setCurrentUser({
        ...currentUser,
        ...adminData,
        name: adminData.name || "Admin",
        avatar: adminData.avatar || "avatar_1",
        email: adminData.email || "",
      });
    }
  }, []);

  // Initialize default userData state
  const defaultUserData = {
    name: "",
    avatar: "avatar_1",
    email: "",
    password: "",
    balance: 50,
    date: defaultDate, // Using the already defined defaultDate
    accountStatus: "No Active Plan",
    investmentCount: 0,
    referralCount: 0,
    admin: false,
    idnum: 101010,
    userName: "John Doe",
  };

  const [userData, setUserData] = useState(defaultUserData);

  const [investData, setInvestData] = useState({
    idnum: currentUser?.idnum,
    plan: "Gold",
    status: "Pending",
    capital: 0,
    date: defaultDate,
    duration: 5,
    paymentOption: "Bitcoin",
    roi: 0,
    bonus: 0,
  });
  const [withdrawData, setWithdrawData] = useState({
    idnum: currentUser?.idnum,
    status: "Pending",
    amount: 200,
    date: defaultDate,
    paymentOption: "Bitcoin",
    authStatus: "unseen",
    admin: false,
  });
  const [widgetState, setWidgetState] = useState({
    state: false,
    type: "avatar",
  });

  // Fetch investments
  useEffect(() => {
    const colRef = collection(db, "investments");
    const q = query(colRef, where("admin", "==", false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const books = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }));
      setInvestments(books);
    });

    return () => unsubscribe();
  }, []);

  // Fetch users
  useEffect(() => {
    const colRefNotif = collection(db, "userlogs");
    const q2 = query(colRefNotif, where("admin", "==", false));

    const unsubscribe = onSnapshot(q2, (snapshot) => {
      const utilNotif = snapshot.docs.map((doc) => ({
        ...doc.data(),
        password: "******",
        id: doc.id
      }));
  setActiveUsers(utilNotif);
    });

    return () => unsubscribe();
  }, []);

  // Fetch withdrawals
  useEffect(() => {
    const colRefWith = collection(db, "withdrawals");
    const q3 = query(colRefWith, where("admin", "==", false));

    const unsubscribe = onSnapshot(q3, (snapshot) => {
      const withdrawalList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }));
      setWithdrawals(withdrawalList);
    });

    return () => unsubscribe();
  }, []);

  // Fetch crypto prices with retries and fallback
  async function fetchCryptoPrice(coin) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Call our server-side proxy to avoid CORS issues
        const response = await fetch(`/api/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd`);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        return data[coin]?.usd || null;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
    
    // Fallback values if all attempts fail
    return coin === 'ethereum' ? 2000 : 35000; // Default values for ETH and BTC
  }

  useEffect(() => {
    // First check admin authorization
    const activeUser = JSON.parse(localStorage.getItem("activeUser") || "null");
    const adminData = JSON.parse(localStorage.getItem("adminData") || "null");
    
    if (!activeUser || !adminData || !activeUser.isAdmin) {
      router.replace("/signin_admin");
      return;
    }

    // Then proceed with normal initialization
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    // Fetch crypto prices with better error handling
    fetchCryptoPrice('ethereum').then(price => setEthPrice(price));
    fetchCryptoPrice('bitcoin').then(price => setBitPrice(price));

    setShowSidePanel(false);
  }, [profilestate, router]);

  useLayoutEffect(() => {
    const user = JSON.parse(localStorage.getItem("activeUser")) || {};
    if (user.id) {
      const docRef = doc(db, "userlogs", user.id);

      getDoc(docRef).then((doc) => {
        if (doc.data() && doc.data().admin) {
          setCurrentUser({...doc.data(), id: doc.id});
          localStorage.setItem("activeUser", JSON.stringify({...doc.data(), id: doc.id}));
        } else {
          setregisterFromPath("/profile");
          router.push("/signin");
        }
      })
    } else {
      setregisterFromPath("/profile");
      router.push("/signin");
    }
  }, []);


  //user dashboard values
  const totalCapital = investments
    .filter((elem) => (elem?.idnum !== "101010"))
    .reduce((sum, currentObject) => {
      // Ensure that currentObject.capital is a number before adding it to the sum
      const capitalValue =
        typeof currentObject.capital === "number" ? currentObject.capital : parseInt(currentObject.capital) || 0;

      // Add the capital value to the sum
      return sum + capitalValue;
    }, 0);

  const totalROI = investments
    .filter((elem) => elem?.idnum !== "101010")
    .reduce((sum, currentObject) => {
      const ROIvalue = typeof currentObject.roi === "number" ? currentObject.roi : 0;
      return sum + ROIvalue;
    }, 0);

  const totalBonus = investments
    .filter((elem) => elem?.idnum !== "101010")
    .reduce((sum, currentObject) => {
      const bonusValue = typeof currentObject.bonus === "number" ? currentObject.bonus : 0;
      return sum + bonusValue;
    }, 0);

  // NOTE: single main return is below (profile-focused layout). Removed the earlier duplicate smaller layout and its old blockchain.com fetcher.

  //Animation variable
  const swipeParent = {
    init: {
      x: "-110%",
      opacity: 0,
    },
    finale: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 200,
        when: "beforeChildren",
      },
    },
    exit: {
      x: "-111%",
      opacity: 1,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 200,
        when: "afterChildren",
      },
    },
  };

  return (
    <div className="mainprofileSect">
      <Head>
          <title>Admin Dashboard</title>
          <meta property="og:title" content="Admin Dashboard"/>
      </Head>
      <div id="mobilenone" className="leftProfile">
        <div className="topmostRightPrile">
            <Link href="/">
              <Image src="/topmintLogo.png" className="theLogo" alt="logo" width={160} height={40} />
            </Link>
          <div className="panelPrfileDisp">
            <div
              className="left"
              style={{ backgroundImage: `url(/${currentUser?.avatar || 'avatar_1'}.png)` }}
            />
            <div className="right">
              <h3>{currentUser?.name}</h3>
              <p>{currentUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="centerRightProfile">
          <ul>
            <li className={profilestate === "Investments" ? "active" : ""} onClick={() => setProfileState("Investments")}>
              <i className="icofont-money-bag"></i> Investments {investments.filter((elem) => elem.authStatus !== "seen").length > 0 && (
                <span>{investments.filter((elem) => elem.authStatus !== "seen").length}</span>
              )}
            </li>

            <li className={profilestate === "Users" ? "active" : ""} onClick={() => setProfileState("Users")}>
              <i className="icofont-users-alt-3"></i> Users {activeUsers.length > 0 && <span>{activeUsers.length}</span>}
            </li>

            <li className="chatLink" onClick={() => { setProfileState("Chats"); }}>
              <i className="icofont-chat"></i> Chat {unreadMessages > 0 && <span>{unreadMessages}</span>}
            </li>

            <li className={profilestate === "Chats" ? "active" : ""} onClick={() => setProfileState("Chats")}>
              <i className="icofont-chat"></i> Admin Chats {unreadMessages > 0 && <span>{unreadMessages}</span>}
            </li>

            <li className={profilestate === "Loans" ? "active" : ""} onClick={() => setProfileState("Loans")}>
              <i className="icofont-wallet"></i> Loans
            </li>

            <li className={profilestate === "KYC" ? "active" : ""} onClick={() => setProfileState("KYC")}>
              <i className="icofont-id-card"></i> KYC
            </li>            <li className={profilestate === "Withdrawals" ? "active" : ""} onClick={() => setProfileState("Withdrawals")}>
              <i className="icofont-pay"></i> Withdrawals {withdrawals.filter((elem) => elem.authStatus !== "seen").length > 0 && (
                <span>{withdrawals.filter((elem) => elem.authStatus !== "seen").length}</span>
              )}
            </li>
          </ul>
        </div>

        <div className="rightLeftProfile">
          <button className="borderBtn" onClick={handleLogout}>
            Log Out <i className="icofont-logout"></i>
          </button>
        </div>
      </div>
      <div className="rightProfile">
        <h1>
          {profilestate}{" "}
          <span>
            {new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            .
          </span>
        </h1>
        <div className="topmostRightProfile">
          <div className="unitUserEarningDisplay fancybg">
            <h3>
              Total Revenue{" "}
              <span
                onClick={() => {
                  setPasswordShow((prev) => !prev);
                }}
              >
                <i
                  className={`icofont-eye-${!passwordShow ? "alt" : "blocked"}`}
                ></i>
              </span>
            </h3>
            <h2>
              $
              {passwordShow
                ? `${totalCapital.toLocaleString()}`
                : "******"}
            </h2>
          </div>
          <div className="unitUserEarningDisplay fancybg">
            <h3>Active Users</h3>
            <h2>{`${activeUsers.length}`}</h2>
          </div>
          <div className="unitUserEarningDisplay fancybg">
            <h3>Active Investments</h3>
            <h2>
              {`${
                investments.filter(
                  (elem) => elem?.status === "Active" && elem?.idnum !== "101010"
                ).length
              }`}
            </h2>
          </div>
          <div className="unitUserEarningDisplay fancybg">
            <h3>Pending Plans</h3>
            <h2>
              {`${
                investments.filter(
                  (elem) =>
                    (elem?.status === "Pending" && elem?.idnum !== "101010")
                ).length
              }`}
            </h2>
          </div>
        </div>
        {profilestate === "Investments" && (
          <InvestAdminSect
            investments={investments}
            currentUser={currentUser}
            setProfileState={setProfileState}
            setInvestData={setInvestData}
          />
        )}
        {profilestate === "Users" && (
          <UsersAdmin
            activeUsers={activeUsers}
            investments={investments}
            withdrawals={withdrawals}
            setProfileState={setProfileState}
            setUserData={setUserData}
          />
        )}
        {profilestate === "Payments" && (
          <PaymentSect
            setProfileState={setProfileState}
            investData={investData}
            bitPrice={bitPrice}
            ethPrice={ethPrice}
          />
        )}
        {profilestate === "Withdrawal Payment" && (
          <WithdrawalPayment
            setProfileState={setProfileState}
            withdrawData={withdrawData}
            bitPrice={bitPrice}
            ethPrice={ethPrice}
            currentUser={currentUser}
          />
        )}
        {profilestate === "Withdrawals" && (
          <WithdrawAdmin
            withdrawals={withdrawals}
            setProfileState={setProfileState}
            setWithdrawData={setWithdrawData}
          />
        )}
        {profilestate === "Edit Investment" && (
          <UnitInvestSect
            setProfileState={setProfileState}
            setInvestData={setInvestData}
            investData={investData}
            currentUser={currentUser}
          />
        )}
        {profilestate === "Edit User" && (
          <UnitUserSect
            setProfileState={setProfileState}
            setUserData={setUserData}
            userData={userData}
          />
        )}
        {profilestate === "Edit Withdraw" && (
          <UnitWithdrawSect
            setProfileState={setProfileState}
            setWithdrawData={setWithdrawData}
            withdrawData={withdrawData}
          />
        )}
        {profilestate === "Chats" && (
          <AdminChat />
        )}
        {profilestate === "Loans" && (
          <LoansAdmin setProfileState={setProfileState} currentUser={currentUser} />
        )}
        {profilestate === "KYC" && (
          <KycAdmin currentUser={currentUser} />
        )}
        <footer className="profilefooter">
          <p>
            Proudly powered by{" "}
            <a
              href="https://www.tradingview.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Trading view
            </a>
          </p>
          <p>|</p>
          <p>
            <i className="icofont-shield-alt"></i> Protected by{" "}
            <a
              href="https://www.cloudflare.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/cloudflare.png" alt="cloudflare" width={120} height={40} />
            </a>
          </p>
        </footer>
      </div>
      <button
        id="floatingButton"
        type="button"
        className="menuBtn floatingBtn"
        onClick={() => {
          setShowSidePanel(true);
        }}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {widgetState.state && (
        <DynamicWidget
          widgetState={widgetState}
          setWidgetState={setWidgetState}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          investData={investData}
          setInvestData={setInvestData}
          setProfileState={setProfileState}
          withdrawData={withdrawData}
          setWithdrawData={setWithdrawData}
          totalBonus={totalBonus}
          totalCapital={totalCapital}
          totalROI={totalROI}
        />
      )}

      <AnimatePresence>
        {showSidePanel && (
          <motion.div
            id="mobilepop"
            className="leftProfile"
            initial="init"
            animate="finale"
            exit="exit"
            variants={swipeParent}
          >
            <div className="topmostRightPrile">
              <Link href={"/"}>
                <img src="/topmintLogo.png" className="theLogo" alt="logo" />
              </Link>
              <div className="panelPrfileDisp">
                <div
                  className="left"
                  style={{
                    backgroundImage: `url(/${currentUser?.avatar || 'avatar_1'}.png)`,
                  }}
                ></div>
                <div className="right">
                  <h3>{currentUser?.name}</h3>
                  <p>{currentUser?.email}</p>
                </div>
              </div>
            </div>
            <div className="centerRightProfile">
              <ul>
                <li
                  className={profilestate === "Investments" ? "active" : ""}
                  onClick={() => {
                    setProfileState("Investments");
                  }}
                >
                  <i className="icofont-money-bag"></i> Investments{" "}
                  <span>
                    {
                      investments.filter((elem) => elem.authStatus !== "seen")
                        .length
                    }
                  </span>
                </li>
                <li
                  className={profilestate === "Users" ? "active" : ""}
                  onClick={() => {
                    setProfileState("Users");
                  }}
                >
                  <i className="icofont-users-alt-3"></i> Users{" "}
                  <span>
                    {
                      activeUsers.filter((elem) => elem.authStatus !== "seen")
                        .length
                    }
                  </span>
                </li>
                <li className={profilestate === "Chats" ? "active" : ""} onClick={() => setProfileState("Chats")}>
                  <i className="icofont-chat"></i> Admin Chats {unreadMessages > 0 && <span>{unreadMessages}</span>}
                </li>
                <li className={profilestate === "Loans" ? "active" : ""} onClick={() => setProfileState("Loans")}>
                  <i className="icofont-wallet"></i> Loans
                </li>
                <li
                  className={profilestate === "Withdrawals" ? "active" : ""}
                  onClick={() => {
                    setProfileState("Withdrawals");
                  }}
                >
                  <i className="icofont-pay"></i> Withdrawals{" "}
                  <span>
                    {
                      withdrawals.filter((elem) => elem.authStatus !== "seen")
                        .length
                    }
                  </span>
                </li>
              </ul>
            </div>
            <div className="rightLeftProfile">
              <button className="borderBtn" onClick={logout}>
                Log Out <i className="icofont-logout"></i>{" "}
              </button>
            </div>

            <button
              type="button"
              className="panelCloseBtn"
              onClick={() => {
                setShowSidePanel(false);
              }}
            >
              <i className="icofont-close-line"></i>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

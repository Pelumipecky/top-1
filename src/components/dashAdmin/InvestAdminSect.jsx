import React, { useEffect, useState } from 'react';
import { db } from "../../database/firebaseConfig";
import { doc, updateDoc, addDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore";

const InvestAdminSect = ({ setInvestData, setProfileState, investments, totalCapital, bitPrice, ethPrice, currentUser }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Calculate total ROI and bonus
    const totalROI = investments.reduce((sum, inv) => sum + (parseFloat(inv.roi) || 0), 0);
    const totalBonus = investments.reduce((sum, inv) => sum + (parseFloat(inv.bonus) || 0), 0);
    
    // Filter investments based on status and search
    const filteredInvestments = investments.filter(inv => {
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesSearch = !searchTerm || 
            inv.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.idnum.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const handleActiveInvestment = (vlad) => {
        const docRef = doc(db, "investments", vlad?.id);

        updateDoc(docRef, {
            status: "Expired",
        });

        setProfileState("Withdrawals");
    };

    useEffect(() => {
        investments.forEach((elem) => {
            if (elem?.status === "Active" && Math.floor((new Date() - new Date(elem?.date)) / (1000 * 60 * 60 * 24)) + 1 >= elem?.duration) {
                handleActiveInvestment(elem);
            }
        });
    }, []);
  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <div className="dashboardStats">
          <div className="statCard">
            <h3>Total Revenue</h3>
            <h2>${totalCapital ? totalCapital.toLocaleString() : '0'}</h2>
          </div>
          <div className="statCard">
            <h3>Total ROI</h3>
            <h2>${totalROI.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Total Bonus</h3>
            <h2>${totalBonus.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Active Investments</h3>
            <h2>{investments.filter(i => i.status === 'Active').length}</h2>
          </div>
          <div className="statCard">
            <h3>Pending Investments</h3>
            <h2>{investments.filter(i => i.status === 'Pending').length}</h2>
          </div>
          <div className="statCard">
            <h3>Bitcoin Price</h3>
            <h2>${bitPrice ? Number(bitPrice).toLocaleString() : '0'}</h2>
          </div>
          <div className="statCard">
            <h3>Ethereum Price</h3>
            <h2>${ethPrice ? Number(ethPrice).toLocaleString() : '0'}</h2>
          </div>
        </div>
        <div className="filterSection">
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search by plan or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="statusFilter">
            <button 
              className={filterStatus === 'all' ? 'active' : ''} 
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={filterStatus === 'Active' ? 'active' : ''} 
              onClick={() => setFilterStatus('Active')}
            >
              Active
            </button>
            <button 
              className={filterStatus === 'Pending' ? 'active' : ''} 
              onClick={() => setFilterStatus('Pending')}
            >
              Pending
            </button>
            <button 
              className={filterStatus === 'Expired' ? 'active' : ''} 
              onClick={() => setFilterStatus('Expired')}
            >
              Expired
            </button>
          </div>
        </div>
      </div>
      <div className="myinvestmentSection">
        <h2>Investments Stack</h2>
        {
            investments.length > 0 ? (
                <div className="historyTable">
                    <div className="investmentTablehead header">
                        <div className="unitheadsect">S/N</div>
                        <div className="unitheadsect">Plan</div>
                        <div className="unitheadsect">Capital</div>
                        <div className="unitheadsect">Status</div>
                        <div className="unitheadsect">ROI</div>
                        <div className="unitheadsect">Bonus</div>
                    </div>
                    {
                        investments.sort((a, b) => {
                            const dateA = new Date(a.date);
                            const dateB = new Date(b.date);
                          
                            return dateB - dateA;
                        }).map((elem, idx) => (
                                  <div className="investmentTablehead" key={`${elem.id}-aDash_${idx}`} onClick={() => {setInvestData(elem); setProfileState("Edit Investment")}}>
                                <div className="unitheadsect">{idx + 1}</div>
                                <div className="unitheadsect">{elem?.plan}</div>
                                <div className="unitheadsect">${elem?.capital.toLocaleString()}</div>
                                    <div className="unitheadsect"><span style={{color: `${elem?.status === "Pending" ? "#F9F871" : elem?.status === "Expired" ? "#DC1262" : "#2DC194"}`}}>{elem?.status}</span></div>
                                <div className="unitheadsect">{elem?.roi}</div>
                                <div className="unitheadsect">${parseInt(elem?.bonus).toLocaleString()}</div>
                                    <div className="unitheadsect">
                    {elem?.status === 'Pending' && (
                      <button
                        className="activateBtn"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = window.confirm(`Approve investment ${elem.id} for ${elem.idnum}? This will credit the user's balance.`);
                          if (!ok) return;
                          try {
                            const invRef = doc(db, 'investments', elem.id);

                            // find user by idnum (outside transaction to locate doc id)
                            const usersCol = collection(db, 'userlogs');
                            const q = query(usersCol, where('idnum', '==', elem.idnum));
                            const userSnap = await getDocs(q);
                            const userDoc = !userSnap.empty ? userSnap.docs[0] : null;

                            const approvedAt = new Date().toISOString();
                            const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

                            // Run transaction to update investment and user atomically
                            await runTransaction(db, async (tx) => {
                              tx.update(invRef, { status: 'Active', date: approvedAt, authStatus: 'seen', approvedBy, approvedAt });

                              if (userDoc) {
                                const userRef = doc(db, 'userlogs', userDoc.id);
                                const udata = userDoc.data() || {};
                                const currentBalance = parseFloat(udata.balance) || 0;
                                const currentBonus = parseFloat(udata.bonus) || 0;
                                const creditAmount = parseFloat(elem.capital) || 0;
                                const bonusAmount = parseFloat(elem.bonus) || 0;
                                tx.update(userRef, { balance: currentBalance + creditAmount, bonus: currentBonus + bonusAmount, authStatus: 'seen' });
                              }
                            });

                            // add notification after successful transaction
                            const notifCol = collection(db, 'notifications');
                            const notificationPush = {
                              message: `Your $${elem.capital} ${elem.plan} investment plan has been activated`,
                              dateTime: approvedAt,
                              idnum: elem.idnum,
                              status: 'unseen'
                            };
                            await addDoc(notifCol, { ...notificationPush });

                            setProfileState('Investments');
                          } catch (err) {
                            console.error('Inline approve error (transaction):', err);
                          }
                        }}
                      >
                        Approve
                      </button>
                    )}
                                    </div>
                            </div>
                        ))
                    }
                </div>

            ) : (

                <div className="emptyTable">
                    <i className="icofont-exclamation-tringle"></i>
                    <p>
                        Your investment stack is currently empty.
                    </p>
                </div>
            )
        }
      </div>
    </div>
  )
}

export default InvestAdminSect

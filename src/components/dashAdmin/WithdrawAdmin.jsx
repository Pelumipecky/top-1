import React, { useState } from 'react';
import GenerateWithdrawalCode from './GenerateWithdrawalCode';

const WithdrawAdmin = ({ withdrawals, activeUsers, setProfileState, setWithdrawData}) => {
    const [showCodeGenerator, setShowCodeGenerator] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Calculate withdrawal stats
    const withdrawalStats = {
        totalAmount: withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0),
        pendingAmount: withdrawals.filter(w => w.status === 'Pending')
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0),
        completedAmount: withdrawals.filter(w => w.status === 'Active')
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0),
        totalFees: withdrawals.reduce((sum, w) => sum + (parseFloat(w.withdrawalFee) || 0), 0)
    };

    // Filter withdrawals
    const filteredWithdrawals = withdrawals.filter(withdrawal => {
        const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus;
        const matchesSearch = !searchTerm || 
            withdrawal.idnum.toString().includes(searchTerm) ||
            withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });
    
    return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <button 
          onClick={() => setShowCodeGenerator(!showCodeGenerator)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--primary-clr)',
            color: 'var(--text-deco)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          {showCodeGenerator ? 'Hide Code Generator' : 'Generate Withdrawal Code'}
        </button>

        {showCodeGenerator && <GenerateWithdrawalCode onClose={() => setShowCodeGenerator(false)} />}

        <div className="dashboardStats">
          <div className="statCard">
            <h3>Total Withdrawals</h3>
            <h2>${withdrawalStats.totalAmount.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Pending Amount</h3>
            <h2>${withdrawalStats.pendingAmount.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Completed Amount</h3>
            <h2>${withdrawalStats.completedAmount.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Total Fees</h3>
            <h2>${withdrawalStats.totalFees.toLocaleString()}</h2>
          </div>
        </div>
        <div className="filterSection">
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search by transaction or user ID..." 
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
              Completed
            </button>
            <button 
              className={filterStatus === 'Pending' ? 'active' : ''} 
              onClick={() => setFilterStatus('Pending')}
            >
              Pending
            </button>
          </div>
        </div>
      </div>
      <div className="myinvestmentSection">
        <h2>Withdrawals Stack ({filteredWithdrawals.length})</h2>
      {
          withdrawals.length > 0 ? (
              <div className="historyTable">
                  <div className="investmentTablehead header">
                      <div className="unitheadsect">S/N</div>
                      <div className="unitheadsect">Amount</div>
                      <div className="unitheadsect">Transaction Id.</div>
                      <div className="unitheadsect">Register ID</div>
                      <div className="unitheadsect">Status</div>
                      <div className="unitheadsect">Made On</div>
                  </div>
                  {
                      withdrawals.sort((a, b) => {
                          const dateA = new Date(a.date);
                          const dateB = new Date(b.date);
                        
                          return dateA - dateB;
                      }).map((elem, idx) => (
                          <div className="investmentTablehead" key={`${elem.idnum}-UWithdraw_${idx}`} onClick={() => {setWithdrawData(elem); setProfileState("Edit Withdraw")}}>
                              <div className="unitheadsect">{idx + 1}</div>
                              <div className="unitheadsect">{elem?.amount}</div>
                              <div className="unitheadsect">{elem?.id}</div>
                              <div className="unitheadsect">{elem?.idnum}</div>
                              <div className="unitheadsect"><span style={{color: `${elem?.status === "Pending" ? "#F9F871" : elem?.status === "Expired" ? "#DC1262" : "#2DC194"}`}}>{elem?.status}</span></div>
                              <div className="unitheadsect">{new Date(elem?.date).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })} | {new Intl.DateTimeFormat('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  }).format(new Date(elem?.date))}</div>
                          </div>
                      ))
                  }
              </div>

          ) : (

              <div className="emptyTable">
                  <i className="icofont-exclamation-tringle"></i>
                  <p>
                      You currently have no data in your withdrawal stack.
                  </p>
              </div>
          )
      }
    </div>
  </div>
  )
}

export default WithdrawAdmin

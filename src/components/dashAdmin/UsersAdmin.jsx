import React, { useEffect, useState } from 'react';
import { db } from "../../database/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const UsersAdmin = ({ activeUsers = [], investments = [], withdrawals = [], setProfileState, setUserData}) => {
  const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Calculate user stats
    const userStats = activeUsers.reduce((stats, user) => {
        const userInvestments = investments.filter(inv => inv.idnum === user.idnum);
        const userWithdrawals = withdrawals.filter(w => w.idnum === user.idnum);
        
        return {
            totalUsers: stats.totalUsers + 1,
            activeUsers: stats.activeUsers + (userInvestments.some(inv => inv.status === 'Active') ? 1 : 0),
            totalBalance: stats.totalBalance + (parseFloat(user.balance) || 0),
            avgInvestment: stats.avgInvestment + (userInvestments.reduce((sum, inv) => sum + (parseFloat(inv.capital) || 0), 0) / (userInvestments.length || 1))
        };
    }, { totalUsers: 0, activeUsers: 0, totalBalance: 0, avgInvestment: 0 });

    useEffect(() => {
        activeUsers.forEach(element => {
            const docRef = doc(db, "userlogs", element?.id);
            updateDoc(docRef, { authStatus: "seen" });
        });
    }, []);
    
  const filteredUsers = activeUsers.filter(user => {
    return !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.idnum.toString().includes(searchTerm);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = sortField === 'date' ? new Date(a[sortField]) : a[sortField];
    let bValue = sortField === 'date' ? new Date(b[sortField]) : b[sortField];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <div className="dashboardStats">
          <div className="statCard">
            <h3>Total Users</h3>
            <h2>{userStats.totalUsers}</h2>
          </div>
          <div className="statCard">
            <h3>Active Users</h3>
            <h2>{userStats.activeUsers}</h2>
          </div>
          <div className="statCard">
            <h3>Total Balance</h3>
            <h2>${userStats.totalBalance.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Avg Investment</h3>
            <h2>${Math.round(userStats.avgInvestment).toLocaleString()}</h2>
          </div>
        </div>
        <div className="filterSection">
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sortOptions">
            <select onChange={(e) => setSortField(e.target.value)}>
              <option value="date">Join Date</option>
              <option value="balance">Balance</option>
              <option value="investmentCount">Investments</option>
            </select>
            <button onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    <div className="myinvestmentSection">
      <h2>Users Data ({filteredUsers.length})</h2>
      {
          activeUsers.length > 0 ? (
              <div className="historyTable">
                  <div className="investmentTablehead header">
                      <div className="unitheadsect">S/N</div>
                      <div className="unitheadsect">Name</div>
                      <div className="unitheadsect">Email</div>
                      <div className="unitheadsect">Crptic ID</div>
                      <div className="unitheadsect">Joined On</div>
                  </div>
                  {
                      activeUsers.sort((a, b) => {
                          const dateA = new Date(a.date);
                          const dateB = new Date(b.date);
                        
                          return dateB - dateA;
                      }).map((elem, idx) => (
                          <div className="investmentTablehead" key={`${elem.idnum}-UAdmin_${idx}`} onClick={() => {setUserData(elem); setProfileState("Edit User")}}>
                              <div className="unitheadsect">{idx + 1}</div>
                              <div className="unitheadsect">{elem?.name}</div>
                              <div className="unitheadsect">{elem?.email}</div>
                              <div className="unitheadsect">{elem?.id}</div>
                              <div className="unitheadsect">{new Date(elem?.date).toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric", })}</div>
                          </div>
                      ))
                  }
              </div>

          ) : (

              <div className="emptyTable">
                  <i className="icofont-exclamation-tringle"></i>
                  <p>
                      You currently have no active user.
                  </p>
              </div>
          )
      }
    </div>
  </div>
  )
}

export default UsersAdmin

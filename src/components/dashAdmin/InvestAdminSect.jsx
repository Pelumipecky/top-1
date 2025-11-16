import React, { useEffect, useState } from 'react';
import { supabaseDb } from "../../database/supabaseUtils";
import { supabase } from "../../database/supabaseConfig";

const InvestAdminSect = ({ setInvestData, setProfileState, investments, totalCapital, bitPrice, ethPrice, currentUser }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Calculate total ROI and bonus (both credited and total)
    const totalCreditedROI = investments.reduce((sum, inv) => sum + (parseFloat(inv.credited_roi) || 0), 0);
    const totalROI = investments.reduce((sum, inv) => sum + (parseFloat(inv.roi) || 0), 0);
    const totalCreditedBonus = investments.reduce((sum, inv) => sum + (parseFloat(inv.credited_bonus) || 0), 0);
    const totalBonus = investments.reduce((sum, inv) => sum + (parseFloat(inv.bonus) || 0), 0);
    
    // Filter investments based on status and search
    const filteredInvestments = investments.filter(inv => {
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesSearch = !searchTerm || 
            inv.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.idnum.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const handleActiveInvestment = async (vlad) => {
        try {
            await supabaseDb.updateInvestment(vlad?.id, {
                status: "Expired",
            });
            setProfileState("Withdrawals");
        } catch (error) {
            console.error('Error updating investment:', error);
        }
    };

    // Function to distribute earnings over time
    const distributeEarnings = async (investment) => {
        try {
            const investmentDate = new Date(investment.date);
            const now = new Date();
            const daysElapsed = Math.floor((now - investmentDate) / (1000 * 60 * 60 * 24));

            if (daysElapsed < 1) return; // No earnings yet

            const totalDuration = investment.duration || 1;
            const roiPerDay = parseFloat(investment.roi) / totalDuration;
            const bonusPerDay = parseFloat(investment.bonus) / totalDuration;

            const earnedROI = Math.min(roiPerDay * daysElapsed, parseFloat(investment.roi));
            const earnedBonus = Math.min(bonusPerDay * daysElapsed, parseFloat(investment.bonus));

            // Find user and update their earnings
            const { data: userData, error: userError } = await supabase
                .from('userlogs')
                .select('*')
                .eq('idnum', investment.idnum)
                .single();

            if (userError || !userData) {
                console.error('User lookup error for earnings distribution:', userError);
                return;
            }

            // Calculate how much should be credited today vs already credited
            const previouslyCreditedROI = parseFloat(investment.credited_roi || 0);
            const previouslyCreditedBonus = parseFloat(investment.credited_bonus || 0);

            const roiToCredit = earnedROI - previouslyCreditedROI;
            const bonusToCredit = earnedBonus - previouslyCreditedBonus;

            if (roiToCredit > 0 || bonusToCredit > 0) {
                const currentBalance = parseFloat(userData.balance) || 0;
                const currentBonus = parseFloat(userData.bonus) || 0;

                console.log(`Distributing earnings for investment ${investment.id}:`);
                console.log(`ROI to credit: $${roiToCredit.toFixed(2)}, Bonus to credit: $${bonusToCredit.toFixed(2)}`);

                // Update user balance with earnings
                const { error: userUpdateError } = await supabase
                    .from('userlogs')
                    .update({
                        balance: currentBalance + roiToCredit,
                        bonus: currentBonus + bonusToCredit,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userData.id);

                if (userUpdateError) {
                    console.error('Error updating user earnings:', userUpdateError);
                    return;
                }

                // Update investment with credited amounts
                const { error: investUpdateError } = await supabase
                    .from('investments')
                    .update({
                        credited_roi: earnedROI,
                        credited_bonus: earnedBonus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', investment.id);

                if (investUpdateError) {
                    console.error('Error updating investment credited amounts:', investUpdateError);
                }

                // Create notification for earnings
                if (roiToCredit > 0 || bonusToCredit > 0) {
                    const notificationPush = {
                        title: 'Investment Earnings',
                        message: `You've earned $${roiToCredit.toFixed(2)} ROI and $${bonusToCredit.toFixed(2)} bonus from your ${investment.plan} investment (Day ${Math.min(daysElapsed, totalDuration)}/${totalDuration}).`,
                        idnum: investment.idnum,
                        status: 'unseen',
                        type: 'earnings'
                    };

                    await supabaseDb.createNotification(notificationPush);
                }
            }

        } catch (error) {
            console.error('Error distributing earnings:', error);
        }
    };

    useEffect(() => {
        investments.forEach((elem) => {
            if (elem?.status === "Active") {
                const daysElapsed = Math.floor((new Date() - new Date(elem?.date)) / (1000 * 60 * 60 * 24)) + 1;

                // Distribute earnings for active investments
                distributeEarnings(elem);

                // Check if investment should expire
                if (daysElapsed >= elem?.duration) {
                    handleActiveInvestment(elem);
                }
            }
        });
    }, [investments]);
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
            <h2>${totalCreditedROI.toLocaleString()} / ${totalROI.toLocaleString()}</h2>
            <small style={{color: '#666', fontSize: '0.9em'}}>Credited / Total</small>
          </div>
          <div className="statCard">
            <h3>Total Bonus</h3>
            <h2>${totalCreditedBonus.toLocaleString()} / ${totalBonus.toLocaleString()}</h2>
            <small style={{color: '#666', fontSize: '0.9em'}}>Credited / Total</small>
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
                <div className="investmentsTableContainer">
                    <table className="investmentsTable">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>User ID</th>
                                <th>Plan</th>
                                <th>Capital</th>
                                <th>ROI (Credited/Total)</th>
                                <th>Bonus (Credited/Total)</th>
                                <th>Duration</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                investments.sort((a, b) => {
                                    const dateA = new Date(a.date);
                                    const dateB = new Date(b.date);
                                  
                                    return dateB - dateA;
                                }).map((elem, idx) => (
                                    <tr key={`${elem.id}-aDash_${idx}`} style={{cursor: 'default'}}>
                                        <td>{idx + 1}</td>
                                        <td className="cryptic-id">{elem?.idnum?.toString() || 'N/A'}</td>
                                        <td>{elem?.plan || 'N/A'}</td>
                                        <td className="capital">${parseFloat(elem?.capital || 0).toLocaleString()}</td>
                                        <td className="roi">
                                            ${parseFloat(elem?.credited_roi || 0).toLocaleString()} / ${parseFloat(elem?.roi || 0).toLocaleString()}
                                            <br />
                                            <small style={{color: '#666', fontSize: '0.8em'}}>
                                                {elem?.status === 'Active' ? `${Math.min(Math.floor((new Date() - new Date(elem?.date)) / (1000 * 60 * 60 * 24)), elem?.duration || 0)}/${elem?.duration || 0} days` : ''}
                                            </small>
                                        </td>
                                        <td className="bonus">
                                            ${parseFloat(elem?.credited_bonus || 0).toLocaleString()} / ${parseFloat(elem?.bonus || 0).toLocaleString()}
                                            <br />
                                            <small style={{color: '#666', fontSize: '0.8em'}}>
                                                {elem?.status === 'Active' ? `${Math.min(Math.floor((new Date() - new Date(elem?.date)) / (1000 * 60 * 60 * 24)), elem?.duration || 0)}/${elem?.duration || 0} days` : ''}
                                            </small>
                                        </td>
                                        <td>{elem?.duration || 0} days</td>
                                        <td>{elem?.paymentOption || 'N/A'}</td>
                                        <td>
                                            <span className={`investment-status ${elem?.status?.toLowerCase() || 'pending'}`}>
                                                {elem?.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td>{new Date(elem?.date).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {elem?.status === 'Pending' && (
                                                    <button
                                                        className="action-btn approve"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();

                                                            // Calculate ROI and bonus based on plan
                                                            const capital = parseFloat(elem.capital) || 0;
                                                            let roiMultiplier = 5; // Default 5X ROI for all plans
                                                            let bonusMultiplier = 0;

                                                            // Set bonus multiplier based on plan
                                                            switch (elem.plan?.toLowerCase()) {
                                                                case 'silver':
                                                                    bonusMultiplier = 5; // 5X bonus
                                                                    break;
                                                                case 'gold':
                                                                    bonusMultiplier = 8; // 8X bonus
                                                                    break;
                                                                case 'diamond':
                                                                    bonusMultiplier = 10; // 10X bonus
                                                                    break;
                                                                default:
                                                                    bonusMultiplier = 5; // Default to 5X
                                                            }

                                                            const calculatedROI = capital * roiMultiplier;
                                                            const calculatedBonus = capital * bonusMultiplier;

                                                            const ok = window.confirm(`Approve investment ${elem.id} for user ${elem.idnum}?\n\nPlan: ${elem.plan}\nCapital: $${capital.toLocaleString()}\nROI: $${calculatedROI.toLocaleString()} (${roiMultiplier}X)\nBonus: $${calculatedBonus.toLocaleString()} (${bonusMultiplier}X)\nDuration: ${elem.duration} days\n\nThis will credit the investment amount to their balance immediately. ROI and bonus will be earned over ${elem.duration} days.`);
                                                            if (!ok) return;

                                                            try {
                                                                console.log('Starting investment approval for:', elem.id);
                                                                console.log('Investment data:', elem);
                                                                console.log('Calculated ROI:', calculatedROI, 'Bonus:', calculatedBonus);

                                                                // Find user by idnum
                                                                const { data: userData, error: userError } = await supabase
                                                                    .from('userlogs')
                                                                    .select('*')
                                                                    .eq('idnum', elem.idnum)
                                                                    .single();

                                                                if (userError) {
                                                                    console.error('User lookup error:', userError);
                                                                    throw new Error('User not found');
                                                                }

                                                                console.log('Found user:', userData.id);

                                                                const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

                                                                await supabaseDb.activateInvestment(elem.id, {
                                                                    approvedBy,
                                                                    capital,
                                                                    roi: calculatedROI,
                                                                    bonus: calculatedBonus,
                                                                    idnum: elem.idnum,
                                                                    creditBonus: false
                                                                });

                                                                // Add notification
                                                                const notificationPush = {
                                                                    title: 'Investment Approved',
                                                                    message: `Your $${capital.toLocaleString()} ${elem.plan} investment has been activated! You will earn $${calculatedROI.toLocaleString()} ROI and $${calculatedBonus.toLocaleString()} bonus over ${elem.duration} days.`,
                                                                    idnum: elem.idnum,
                                                                    status: 'unseen',
                                                                    type: 'success'
                                                                };

                                                                const notificationResult = await supabaseDb.createNotification(notificationPush);
                                                                if (notificationResult.error) {
                                                                    console.error('Notification creation error:', notificationResult.error);
                                                                    // Don't throw here - notification failure shouldn't block approval
                                                                } else {
                                                                    console.log('Notification created successfully');
                                                                }

                                                                // Send email notification to user
                                                                try {
                                                                    if (userData?.email) {
                                                                        const emailSubject = 'Investment Approved - TopMintInvest';
                                                                        const emailMessage = `
                                                                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                                                            <h2 style="color: #28a745;">🎉 Investment Approved!</h2>
                                                                            <p>Dear ${userData.name || 'User'},</p>
                                                                            <p>Congratulations! Your investment has been approved and activated.</p>
                                                                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                                                              <h3 style="margin-top: 0;">Investment Details:</h3>
                                                                              <ul style="list-style: none; padding: 0;">
                                                                                <li><strong>Plan:</strong> ${elem.plan}</li>
                                                                                <li><strong>Capital:</strong> $${capital.toLocaleString()}</li>
                                                                                <li><strong>ROI:</strong> $${calculatedROI.toLocaleString()}</li>
                                                                                <li><strong>Bonus:</strong> $${calculatedBonus.toLocaleString()}</li>
                                                                                <li><strong>Duration:</strong> ${elem.duration} days</li>
                                                                              </ul>
                                                                            </div>
                                                                            <p>Your capital amount has been credited to your account balance. ROI and bonus will be earned and credited daily over the investment period.</p>
                                                                            <p>Best regards,<br>TopMintInvest Team</p>
                                                                            <hr>
                                                                            <p style="font-size: 12px; color: #666;">
                                                                              This is an automated message. Please do not reply to this email.
                                                                            </p>
                                                                          </div>
                                                                        `;

                                                                        const emailResponse = await fetch('/api/send-email', {
                                                                          method: 'POST',
                                                                          headers: {
                                                                            'Content-Type': 'application/json',
                                                                          },
                                                                          body: JSON.stringify({
                                                                            to: userData.email,
                                                                            subject: emailSubject,
                                                                            message: emailMessage,
                                                                            type: 'investment_approval'
                                                                          })
                                                                        });

                                                                        if (emailResponse.ok) {
                                                                          console.log('Investment approval email sent successfully');
                                                                        } else {
                                                                          console.error('Failed to send investment approval email');
                                                                        }
                                                                    }
                                                                } catch (emailError) {
                                                                    console.error('Error sending investment approval email:', emailError);
                                                                    // Don't throw here - email failure shouldn't block approval
                                                                }

                                                                alert(`✅ Investment approved successfully!\n\nUser ${elem.idnum} has been credited $${capital.toLocaleString()}.\nThey will earn $${calculatedROI.toLocaleString()} ROI and $${calculatedBonus.toLocaleString()} bonus over ${elem.duration} days.`);

                                                                // Force a refresh of the investments data
                                                                window.location.reload();

                                                            } catch (err) {
                                                                console.error('Investment approval error:', err);
                                                                alert(`❌ Failed to approve investment: ${err.message}`);
                                                            }
                                                        }}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
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

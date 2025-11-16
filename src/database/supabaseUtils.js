import { supabase } from './supabaseConfig';

// Export the supabase instance for direct use
export { supabase };

// Authentication functions
export const supabaseAuth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database functions
export const supabaseDb = {
  // User operations
  getUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    return { data, error };
  },

  getUserById: async (id) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  getUserByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('idnum', idnum)
      .single();
    return { data, error };
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateUser: async (id, updates) => {
    const { data, error } = await supabase
      .from('userlogs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  updateUserDetails: async (id, updates) => {
    const { data, error } = await supabase
      .from('userlogs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  addFundsToUser: async (userId, { balance: addBalance, bonus: addBonus, modifiedBy }) => {
    // First get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('userlogs')
      .select('balance, bonus, idnum')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = parseFloat(userData.balance) || 0;
    const currentBonus = parseFloat(userData.bonus) || 0;
    const deltaBalance = parseFloat(addBalance) || 0;
    const deltaBonus = parseFloat(addBonus) || 0;
    const modifiedAt = new Date().toISOString();

    // Update user balance and bonus
    const { data, error } = await supabase
      .from('userlogs')
      .update({
        balance: currentBalance + deltaBalance,
        bonus: currentBonus + deltaBonus,
        authStatus: 'seen',
        updated_at: modifiedAt
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Create notification for the user
    await supabase
      .from('notifications')
      .insert([{
        idnum: userData.idnum,
        type: 'balance_update',
        title: 'Account Balance Updated',
        message: `Your account has been credited with $${deltaBalance.toLocaleString()} balance and $${deltaBonus.toLocaleString()} bonus.`,
        status: 'unseen',
        created_at: modifiedAt,
        updated_at: modifiedAt
      }]);

    return { data, error: null };
  },

  deleteUser: async (id) => {
    const { data, error } = await supabase
      .from('userlogs')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  createUser: async (userData) => {
    const { data, error } = await supabase
      .from('userlogs')
      .insert([{
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getAdminUser: async () => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('admin', true)
      .eq('name', 'admin')
      .single();
    return { data, error };
  },

  // Investment operations
  getInvestmentsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getAllInvestments: async () => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createInvestment: async (investmentData) => {
    // Only include properties that exist in the investments table schema
    const cleanData = {
      idnum: investmentData.idnum,
      plan: investmentData.plan,
      status: investmentData.status || 'pending',
      capital: investmentData.capital,
      roi: investmentData.roi || 0,
      bonus: investmentData.bonus || 0,
      duration: investmentData.duration || 5,
      paymentOption: investmentData.paymentOption || 'Bitcoin',
      authStatus: investmentData.authStatus || 'unseen'
    };

    console.log('Creating investment with data:', cleanData);

    const { data, error } = await supabase
      .from('investments')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating investment:', error);
    }

    return { data, error };
  },

  deleteInvestmentsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('investments')
      .delete()
      .eq('id', userId);
    return { data, error };
  },

  updateInvestment: async (id, updates) => {
    const { data, error } = await supabase
      .from('investments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  activateInvestment: async (investmentId, {
    approvedBy,
    capital = 0,
    roi = 0,
    bonus = 0,
    idnum,
    creditBonus = false
  }) => {
    const approvedAt = new Date().toISOString();
    const toNumber = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const capitalAmount = toNumber(capital);
    const roiAmount = toNumber(roi);
    const bonusAmount = toNumber(bonus);

    // Update investment status and payout targets
    const { data: investmentData, error: investError } = await supabase
      .from('investments')
      .update({
        status: 'Active',
        roi: roiAmount,
        bonus: bonusAmount,
        credited_roi: 0,
        credited_bonus: 0,
        approved_at: approvedAt,
        authStatus: 'seen',
        approved_by: approvedBy || null,
        updated_at: approvedAt
      })
      .eq('id', investmentId)
      .select()
      .single();

    if (investError) {
      console.error('activateInvestment: investment update failed', investError);
      throw investError;
    }

    // Get user and update balance/bonus
    const { data: userData, error: userFetchError } = await supabase
      .from('userlogs')
      .select('balance, bonus')
      .eq('idnum', idnum)
      .single();

    if (userFetchError) {
      console.error('activateInvestment: user fetch failed', userFetchError);
      throw userFetchError;
    }

    const currentBalance = parseFloat(userData.balance) || 0;
    const currentBonus = parseFloat(userData.bonus) || 0;

    const userUpdates = {
      balance: Number((currentBalance + capitalAmount).toFixed(2)),
      authStatus: 'seen',
      updated_at: approvedAt
    };

    if (creditBonus) {
      userUpdates.bonus = Number((currentBonus + bonusAmount).toFixed(2));
    }

    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('userlogs')
      .update(userUpdates)
      .eq('idnum', idnum)
      .select()
      .single();

    if (userUpdateError) {
      console.error('activateInvestment: user update failed', userUpdateError);
      throw userUpdateError;
    }

    return { investmentData, updatedUser, error: null };
  },

  // Loan operations
  updateLoanStatus: async (loanId, { status, approvedBy, approvedByName }) => {
    const updatedAt = new Date().toISOString();

    // First get the loan data
    const { data: loanData, error: loanFetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanFetchError) throw loanFetchError;
    if (loanData.status === status) return { data: loanData, error: null };

    // Update loan status
    const { data: updatedLoan, error: loanUpdateError } = await supabase
      .from('loans')
      .update({
        status,
        updated_at: updatedAt,
        approved_by: approvedBy,
        approved_by_name: approvedByName
      })
      .eq('id', loanId)
      .select()
      .single();

    if (loanUpdateError) throw loanUpdateError;

    // If approving, credit user balance and bonus
    if (status === 'Approved') {
      if (!loanData.user_id) {
        throw new Error('Loan user_id missing. Cannot credit user.');
      }

      const { data: userData, error: userFetchError } = await supabase
        .from('userlogs')
        .select('balance, bonus')
        .eq('id', loanData.user_id)
        .single();

      if (userFetchError) throw userFetchError;

      const prevBalance = parseFloat(userData.balance) || 0;
      const prevBonus = parseFloat(userData.bonus) || 0;
      const creditAmount = parseFloat(loanData.amount) || 0;
      // Add 5% bonus on loan amount
      const bonusAmount = creditAmount * 0.05;

      const { data: updatedUser, error: userUpdateError } = await supabase
        .from('userlogs')
        .update({
          balance: prevBalance + creditAmount,
          bonus: prevBonus + bonusAmount,
          last_modified_by: approvedBy,
          last_modified_at: updatedAt,
          updated_at: updatedAt
        })
        .eq('id', loanData.user_id)
        .select()
        .single();

      if (userUpdateError) throw userUpdateError;
    }

    return { data: updatedLoan, error: null };
  },

  // Notification operations
  getNotificationsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createNotification: async (notificationData) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  updateNotification: async (id, updates) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // KYC operations
  createKYC: async (kycData) => {
    const { data, error } = await supabase
      .from('kyc')
      .insert([{
        ...kycData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getKYCByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('kyc')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getWithdrawalsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createWithdrawalCode: async (codeData) => {
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from('withdrawal_codes')
      .insert([{ ...codeData, created_at: timestamp, updated_at: timestamp }])
      .select()
      .single();
    return { data, error };
  }
};

// Storage functions
export const supabaseStorage = {
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  getAllWithdrawals: async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

// Real-time subscriptions
export const supabaseRealtime = {
  subscribeToUser: (userId, callback) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'userlogs',
          filter: `id=eq.${userId}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToInvestments: (idnum, callback) => {
    const channel = supabase
      .channel(`investments-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToNotifications: (idnum, callback) => {
    const channel = supabase
      .channel(`notifications-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToWithdrawals: (idnum, callback) => {
    const channel = supabase
      .channel(`withdrawals-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToLoans: (idnum, callback) => {
    const channel = supabase
      .channel(`loans-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  // Chat operations
  addChatMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        ...messageData,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getChatMessages: async (userId) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });
    return { data, error };
  },

  subscribeToChatMessages: (userId, callback) => {
    const channel = supabase
      .channel(`chats-${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  getChatCounts: async (userId, isAdmin) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('is_admin')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching chat counts:', error);
        return 0;
      }

      if (isAdmin) {
        // Admin sees count of user messages (non-admin messages)
        return data.filter(msg => !msg.is_admin).length;
      } else {
        // User sees count of admin messages
        return data.filter(msg => msg.is_admin).length;
      }
    } catch (err) {
      console.error('Chat counts error:', err);
      return 0;
    }
  },

  // Loan operations
  createLoan: async (loanData) => {
    const numberOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const stringOrNull = (value) => {
      if (value === null || value === undefined) return null;
      const trimmed = value.toString().trim();
      return trimmed.length ? trimmed : null;
    };

    const referencesPayload = {
      contacts: Array.isArray(loanData.references) ? loanData.references : [],
      emergencyContact: loanData.emergencyContact || null,
      dependents: loanData.dependents ?? null,
      preferredPaymentDate: loanData.preferredPaymentDate ?? null
    };

    const now = new Date().toISOString();
    const cleanLoanData = {
      idnum: loanData.idnum,
      user_id: loanData.user_id || null,
      user_name: stringOrNull(loanData.user_name) || stringOrNull(loanData.userName),
      amount: numberOrNull(loanData.amount),
      purpose: stringOrNull(loanData.purpose),
      employment_status: stringOrNull(loanData.employmentStatus),
      employer: stringOrNull(loanData.employer),
      monthly_income: numberOrNull(loanData.monthlyIncome),
      payment_frequency: loanData.paymentFrequency || 'Monthly',
      employment_duration: stringOrNull(loanData.employmentDuration),
      previous_loans: loanData.previousLoans || 'No',
      collateral: loanData.collateral || 'No',
      collateral_type: stringOrNull(loanData.collateralType),
      collateral_value: numberOrNull(loanData.collateralValue),
      credit_score: stringOrNull(loanData.creditScore),
      references: referencesPayload,
      bank_name: stringOrNull(loanData.bankName),
      account_number: stringOrNull(loanData.accountNumber),
      account_type: loanData.accountType || 'Savings',
      residential_status: loanData.residentialStatus || null,
      monthly_rent: numberOrNull(loanData.monthlyRent),
      residence_duration: stringOrNull(loanData.residenceDuration),
      status: loanData.status || 'Pending',
      interest_rate: numberOrNull(loanData.interestRate),
      duration: Number.isFinite(Number.parseInt(loanData.preferredDuration, 10))
        ? Number.parseInt(loanData.preferredDuration, 10)
        : numberOrNull(loanData.duration),
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('loans')
      .insert([cleanLoanData])
      .select()
      .single();
    return { data, error };
  },

  getLoansByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateLoan: async (id, updates) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Withdrawal operations
  createWithdrawal: async (withdrawalData) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([{
        ...withdrawalData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  deleteWithdrawalsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  },

  updateWithdrawal: async (id, updates) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Admin functions for all records
  subscribeToAllInvestments: (callback) => {
    const channel = supabase
      .channel('all-investments')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToAllUsers: (callback) => {
    const channel = supabase
      .channel('all-users')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'userlogs'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToAllWithdrawals: (callback) => {
    const channel = supabase
      .channel('all-withdrawals')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  // User-specific subscription functions
  subscribeToInvestments: (idnum, callback) => {
    const channel = supabase
      .channel(`user-investments-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToNotifications: (idnum, callback) => {
    const channel = supabase
      .channel(`user-notifications-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );

    channel.subscribe();
    return channel;
  }
};
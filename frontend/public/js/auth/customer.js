/**
 * EntryMySlot - Customer Auth Manager
 * Handles login, register, OTP verification, token refresh, logout.
 * Uses customer auth endpoints at /api/v1/auth/*
 */

(function (global) {
  'use strict';

  var CFG = global.EMS_CONFIG;
  var _user = null;

  function getUser() {
    if (_user) return _user;
    try {
      var stored = localStorage.getItem(CFG.storage.customerUser);
      _user = stored ? JSON.parse(stored) : null;
    } catch (_) { _user = null; }
    return _user;
  }

  function setUser(user) {
    _user = user || null;
    if (user) {
      localStorage.setItem(CFG.storage.customerUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(CFG.storage.customerUser);
    }
  }

  function isLoggedIn() {
    return !!global.EMSApi.getCustomerToken();
  }

  function clear() {
    _user = null;
    global.EMSApi.logoutCustomer();
  }

  async function restoreSession() {
    if (!isLoggedIn()) return null;
    try {
      var result = await global.EMSApi.get('/auth/me', { authScope: 'customer' });
      if (result.ok && result.data) {
        _user = result.data;
        localStorage.setItem(CFG.storage.customerUser, JSON.stringify(_user));
        return _user;
      }
      // Try refresh
      var rt = localStorage.getItem(CFG.storage.customerRefresh);
      if (rt) {
        var refreshed = await global.EMSApi.refreshCustomerToken(rt);
        if (refreshed.ok) {
          var me = await global.EMSApi.get('/auth/me', { authScope: 'customer' });
          if (me.ok && me.data) {
            _user = me.data;
            localStorage.setItem(CFG.storage.customerUser, JSON.stringify(_user));
            return _user;
          }
        }
      }
      clear();
      return null;
    } catch (_) {
      clear();
      return null;
    }
  }

  async function register(data) {
    var result = await global.EMSApi.post('/auth/register-enhanced', {
      email: data.email,
      username: data.username,
      password: data.password,
    }, { authScope: 'customer', skipAuth: true });
    return result;
  }

  async function verifyRegistrationOtp(email, otp) {
    var result = await global.EMSApi.post('/auth/verify-registration-otp', {
      email: email,
      otp: otp,
    }, { authScope: 'customer', skipAuth: true });
    if (result.ok && result.data && result.data.success && result.data.data) {
      var d = result.data.data;
      if (d.tokens) {
        localStorage.setItem(CFG.storage.customerAccess, d.tokens.accessToken);
        localStorage.setItem(CFG.storage.customerRefresh, d.tokens.refreshToken);
      }
      if (d.user) {
        _user = d.user;
        localStorage.setItem(CFG.storage.customerUser, JSON.stringify(_user));
      }
    }
    return result;
  }

  async function resendRegistrationOtp(email) {
    return global.EMSApi.post('/auth/resend-registration-otp', { email: email }, { skipAuth: true });
  }

  async function login(email, password) {
    var result = await global.EMSApi.post('/auth/login', {
      email: email,
      password: password,
    }, { skipAuth: true });
    if (result.ok && result.data && result.data.success && result.data.data) {
      var d = result.data.data;
      if (d.tokens) {
        localStorage.setItem(CFG.storage.customerAccess, d.tokens.accessToken);
        localStorage.setItem(CFG.storage.customerRefresh, d.tokens.refreshToken);
      }
      if (d.user) {
        _user = d.user;
        localStorage.setItem(CFG.storage.customerUser, JSON.stringify(_user));
      }
    }
    return result;
  }

  async function logout() {
    var rt = localStorage.getItem(CFG.storage.customerRefresh);
    try {
      if (rt) {
        await global.EMSApi.post('/auth/logout', { refreshToken: rt }, { skipAuth: true });
      }
    } catch (_) { /* best effort */ }
    clear();
  }

  async function forgotPassword(email) {
    return global.EMSApi.post('/auth/forgot-password', { email: email }, { skipAuth: true });
  }

  async function resetPassword(token, newPassword) {
    return global.EMSApi.post('/auth/reset-password', { token: token, newPassword: newPassword }, { skipAuth: true });
  }

  async function updateProfile(data) {
    return global.EMSApi.patch('/auth/me', data, { authScope: 'customer' });
  }

  global.EMSAuth = Object.freeze({
    getUser: getUser,
    setUser: setUser,
    isLoggedIn: isLoggedIn,
    clear: clear,
    restoreSession: restoreSession,
    register: register,
    verifyRegistrationOtp: verifyRegistrationOtp,
    resendRegistrationOtp: resendRegistrationOtp,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    updateProfile: updateProfile,
  });

})(window);

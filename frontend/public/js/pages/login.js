/**
 * Login page view.
 *
 * Renders the login form into #app before authentication.
 */

const LoginPage = (function () {
  'use strict';

  function render(container) {
    container.innerHTML = '';
    container.className = 'login-screen';

    // Left panel — branding
    var left = DOM.el('div', { className: 'login-screen__left' });
    var brand = DOM.el('div', { className: 'login-screen__brand' });
    brand.appendChild(DOM.el('div', { className: 'login-screen__logo', textContent: 'E' }));
    brand.appendChild(DOM.el('h1', { className: 'login-screen__title', textContent: 'EMS Admin' }));
    brand.appendChild(DOM.el('p', { className: 'login-screen__subtitle', textContent: 'Super Admin Dashboard' }));
    left.appendChild(brand);

    // Right panel — form
    var right = DOM.el('div', { className: 'login-screen__right' });
    var form = DOM.el('div', { className: 'login-form' });
    form.appendChild(DOM.el('h2', { className: 'login-form__title', textContent: 'Sign In' }));
    form.appendChild(DOM.el('p', { className: 'login-form__subtitle', textContent: 'Enter your credentials to access the admin panel' }));

    var errorBox = DOM.el('div', { className: 'login-form__error', id: 'loginError' });
    form.appendChild(errorBox);

    var emailField = DOM.el('div', { className: 'login-form__field' });
    emailField.appendChild(DOM.el('label', { className: 'login-form__label', textContent: 'Email' }));
    var emailInput = DOM.el('input', {
      className: 'login-form__input',
      type: 'email',
      placeholder: 'admin@example.com',
      autocomplete: 'email',
    });
    emailField.appendChild(emailInput);
    form.appendChild(emailField);

    var passField = DOM.el('div', { className: 'login-form__field' });
    passField.appendChild(DOM.el('label', { className: 'login-form__label', textContent: 'Password' }));
    var passInput = DOM.el('input', {
      className: 'login-form__input',
      type: 'password',
      placeholder: '••••••••',
      autocomplete: 'current-password',
    });
    passField.appendChild(passInput);
    form.appendChild(passField);

    var submitBtn = DOM.el('button', {
      className: 'login-form__submit',
      id: 'loginSubmit',
      textContent: 'Sign In',
    });
    form.appendChild(submitBtn);

    var loading = DOM.el('div', { className: 'login-form__loading', id: 'loginLoading', textContent: 'Signing in…' });
    form.appendChild(loading);

    right.appendChild(form);

    container.appendChild(left);
    container.appendChild(right);

    // Bind events
    submitBtn.addEventListener('click', handleSubmit);
    emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSubmit(); });
    passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSubmit(); });

    // Auto-focus email
    emailInput.focus();

    function handleSubmit() {
      var email = emailInput.value.trim();
      var password = passInput.value;

      if (!email || !password) {
        showError('Please enter both email and password.');
        return;
      }

      submitBtn.disabled = true;
      loading.classList.add('login-form__loading--visible');

      AdminAuth.login(email, password)
        .then(function (result) {
          if (result && result.success) {
            // Reload so bootstrap renders the admin shell
            window.location.reload();
          } else {
            var msg = (result && result.message) || 'Invalid credentials.';
            showError(msg);
            submitBtn.disabled = false;
            loading.classList.remove('login-form__loading--visible');
          }
        })
        .catch(function (err) {
          showError(err.message || 'Login failed. Please try again.');
          submitBtn.disabled = false;
          loading.classList.remove('login-form__loading--visible');
        });
    }

    function showError(message) {
      var box = document.getElementById('loginError');
      if (!box) return;
      if (message) {
        box.textContent = message;
        box.classList.add('login-form__error--visible');
      } else {
        box.classList.remove('login-form__error--visible');
      }
    }
  }

  return Object.freeze({ render });
})();

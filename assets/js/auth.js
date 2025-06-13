/**
 * @file auth.js
 * @description Handles all logic for the user authentication page (login/signup).
 */

// --- STATE ---
let isLoginMode = true;

/**
 * Main initialization function for the authentication page.
 */
async function initializeAuthPage() {
    const supabaseClient = window.SupabaseConfig.getClient();
    // If the client isn't configured, we can't check for a session, so just render the form.
    if (!supabaseClient) {
        renderAuthForm();
        return;
    }

    // First, check if the user is already logged in.
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        // If a session exists, the user is logged in. Redirect to the dashboard.
        window.location.href = AppConstants.ROUTES.DASHBOARD;
        return; // Stop further execution
    }

    // If no session, render the login form.
    renderAuthForm();
}

/**
 * Renders the login/signup form into the DOM.
 */
function renderAuthForm() {
    const container = document.getElementById('auth-container');
    if (!container) {
        console.error("Auth container not found!");
        return;
    }

    container.innerHTML = `
        <div class="w-full max-w-md">
            <div class="auth-card">
                <h1 id="form-title" class="auth-title">Login</h1>
                <p id="form-subtitle" class="auth-subtitle">Welcome back! Please enter your details.</p>

                <form id="auth-form" class="auth-form">
                    <div>
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" name="email" required class="form-input">
                    </div>
                    <div>
                        <label for="password" class="form-label">Password</label>
                        <input type="password" id="password" name="password" required class="form-input">
                    </div>
                    <button type="submit" id="submit-button" class="btn btn-primary w-full">
                        Sign In
                    </button>
                </form>

                <div class="auth-toggle-container">
                    <p class="auth-toggle-text">
                        <span id="toggle-text">Don't have an account?</span>
                        <button id="toggle-auth-mode" class="auth-toggle-button">Sign Up</button>
                    </p>
                </div>
            </div>
        </div>
    `;

    // Attach event listeners after rendering the form.
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('toggle-auth-mode').addEventListener('click', toggleAuthMode);
}

/**
 * Toggles the form UI between login and sign-up modes.
 */
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const form = document.getElementById('auth-form');
    if (form) form.reset();

    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-button');
    const toggleText = document.getElementById('toggle-text');
    const toggleBtn = document.getElementById('toggle-auth-mode');

    if (isLoginMode) {
        title.textContent = 'Login';
        subtitle.textContent = 'Welcome back! Please enter your details.';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Sign Up';
    } else {
        title.textContent = 'Create Account';
        subtitle.textContent = 'Create an account to get started.';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
    }
}

/**
 * Handles the form submission for both login and sign-up.
 * @param {Event} e The form submission event.
 */
async function handleAuthSubmit(e) {
    e.preventDefault();
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        showAlert("Cannot connect to the database. Please configure the connection first.", "error");
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    showLoading(isLoginMode ? 'Signing in...' : 'Creating account...');

    try {
        let response;
        if (isLoginMode) {
            response = await supabaseClient.auth.signInWithPassword({ email, password });
        } else {
            response = await supabaseClient.auth.signUp({ email, password });
            if (!response.error) {
                showAlert('Account created! Please check your email to verify.', 'success', 10000);
            }
        }
        
        const { error, data } = response;
        if (error) throw error;

        // On successful login, the user will be redirected.
        if (data.session) {
            window.location.href = AppConstants.ROUTES.DASHBOARD;
        }

    } catch (error) {
        console.error('Authentication error:', error);
        showAlert(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeAuthPage);
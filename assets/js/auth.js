/**
 * Enhanced Authentication Page
 * Modern login/signup interface with animations
 */

// State
let isLoginMode = true;

/**
 * Initialize authentication page with enhanced UI
 */
async function initializeAuthPage() {
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        renderAuthForm();
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        window.location.href = AppConstants.ROUTES.DASHBOARD;
        return;
    }

    renderAuthForm();
}

/**
 * Renders enhanced auth form with animations
 */
function renderAuthForm() {
    const container = document.getElementById('auth-container');
    if (!container) {
        console.error("Auth container not found!");
        return;
    }

    container.innerHTML = `
        <div class="auth-wrapper animate-scaleIn">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="auth-logo animate-bounce">🏨</div>
                    <h1 id="form-title" class="auth-title">Welcome Back</h1>
                    <p id="form-subtitle" class="auth-subtitle">Sign in to access your analytics dashboard</p>
                </div>

                <form id="auth-form" class="auth-form">
                    <div class="form-group animate-fadeInUp delay-100">
                        <label for="email" class="form-label">Email Address</label>
                        <input type="email" id="email" name="email" required class="form-input" placeholder="you@example.com">
                    </div>
                    <div class="form-group animate-fadeInUp delay-200">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" id="password" name="password" required class="form-input" placeholder="••••••••">
                    </div>
                    
                    <div class="form-actions animate-fadeInUp delay-300">
                        <button type="submit" id="submit-button" class="btn btn-primary btn-block">
                            <span class="btn-text">Sign In</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner-small"></span>
                                Signing in...
                            </span>
                        </button>
                    </div>
                </form>

                <div class="auth-divider animate-fadeInUp delay-400">
                    <span>or</span>
                </div>

                <div class="auth-toggle-container animate-fadeInUp delay-500">
                    <p class="auth-toggle-text">
                        <span id="toggle-text">Don't have an account?</span>
                        <button id="toggle-auth-mode" class="auth-toggle-button">Sign Up</button>
                    </p>
                </div>
            </div>
        </div>
    `;

    // Attach event listeners
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('toggle-auth-mode').addEventListener('click', toggleAuthMode);
}

/**
 * Toggle between login and signup with animations
 */
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const form = document.getElementById('auth-form');
    const authCard = document.querySelector('.auth-card');
    
    // Add exit animation
    authCard.style.animation = 'scaleOut 0.3s ease forwards';
    
    setTimeout(() => {
        if (form) form.reset();
        
        const title = document.getElementById('form-title');
        const subtitle = document.getElementById('form-subtitle');
        const submitBtn = document.getElementById('submit-button');
        const toggleText = document.getElementById('toggle-text');
        const toggleBtn = document.getElementById('toggle-auth-mode');
        const btnText = submitBtn.querySelector('.btn-text');

        if (isLoginMode) {
            title.textContent = 'Welcome Back';
            subtitle.textContent = 'Sign in to access your analytics dashboard';
            btnText.textContent = 'Sign In';
            toggleText.textContent = "Don't have an account?";
            toggleBtn.textContent = 'Sign Up';
        } else {
            title.textContent = 'Create Account';
            subtitle.textContent = 'Join us to start tracking occupancy trends';
            btnText.textContent = 'Create Account';
            toggleText.textContent = 'Already have an account?';
            toggleBtn.textContent = 'Sign In';
        }
        
        // Add entrance animation
        authCard.style.animation = 'scaleIn 0.3s ease forwards';
    }, 300);
}

/**
 * Handle form submission with loading states
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
    const submitBtn = document.getElementById('submit-button');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';

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

        if (data.session) {
            // Add success animation before redirect
            const authCard = document.querySelector('.auth-card');
            authCard.style.animation = 'successPulse 0.6s ease';
            
            setTimeout(() => {
                window.location.href = AppConstants.ROUTES.DASHBOARD;
            }, 600);
        }

    } catch (error) {
        console.error('Authentication error:', error);
        showAlert(error.message, 'error');
        
        // Shake animation on error
        const authCard = document.querySelector('.auth-card');
        authCard.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            authCard.style.animation = '';
        }, 500);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Enhanced auth styles
const authStyles = `
<style>
.auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    position: relative;
    overflow: hidden;
}

.auth-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
}

.auth-pattern {
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background-image: 
        radial-gradient(at 20% 80%, var(--primary-color) 0px, transparent 50%),
        radial-gradient(at 80% 20%, var(--purple-color) 0px, transparent 50%),
        radial-gradient(at 40% 40%, var(--success-color) 0px, transparent 50%);
    opacity: 0.1;
    animation: morphing 20s ease-in-out infinite;
}

.auth-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 480px;
}

.auth-wrapper {
    width: 100%;
}

.auth-card {
    background: var(--bg-elevated);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: var(--spacing-2xl);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.auth-logo {
    font-size: 64px;
    margin-bottom: var(--spacing-lg);
    display: inline-block;
}

.auth-title {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--spacing-sm);
}

.auth-subtitle {
    color: var(--text-secondary);
    font-size: var(--font-size-base);
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.form-group {
    position: relative;
}

.form-actions {
    margin-top: var(--spacing-md);
}

.btn-block {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-base);
}

.btn-loading {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.auth-divider {
    text-align: center;
    margin: var(--spacing-lg) 0;
    position: relative;
}

.auth-divider span {
    background: var(--bg-primary);
    padding: 0 var(--spacing-md);
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    position: relative;
}

.auth-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--bg-muted);
}

.auth-toggle-container {
    text-align: center;
}

.auth-toggle-text {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

.auth-toggle-button {
    background: none;
    border: none;
    color: var(--primary-color);
    font-weight: 600;
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
    text-decoration: underline;
}

.auth-toggle-button:hover {
    color: var(--primary-dark);
}

@media (max-width: 640px) {
    .auth-card {
        padding: var(--spacing-xl);
    }
    
    .auth-logo {
        font-size: 48px;
    }
    
    .auth-title {
        font-size: var(--font-size-2xl);
    }
}
</style>
`;

// Inject auth styles
document.head.insertAdjacentHTML('beforeend', authStyles);

// Initialize
document.addEventListener('DOMContentLoaded', initializeAuthPage);
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";

import AuthLayout from "../../components/auth/AuthLayout";

/**
 * Extracts backend auth errors into a string safe for UI rendering.
 * Some responses provide `{ message }`, while others may return a plain string.
 */
function getAuthErrorMessage(error, fallback) {
  const responseData = error.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    (typeof responseData === "string" ? responseData : fallback)
  );
}

/**
 * Detects unverified-email login failures across likely backend phrasings.
 * This keeps the verify-email redirect resilient without changing successful
 * login behavior or role routing.
 */
function isEmailVerificationError(message) {
  const normalizedMessage = String(message).toLowerCase();

  return (
    normalizedMessage.includes("email") &&
    (normalizedMessage.includes("verify") ||
      normalizedMessage.includes("verified") ||
      normalizedMessage.includes("verification"))
  );
}

/**
 * Accepts only same-app return paths that are appropriate for a USER session.
 * Account-gated public actions can pass this through router state without
 * changing default HOST, ADMIN, or normal USER login destinations.
 */
function getSafeUserReturnPath(state) {
  const returnPath = typeof state?.from === "string" ? state.from : "";

  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return "";
  }

  return returnPath.startsWith("/user/") ? returnPath : "";
}

/**
 * Preserves the established role redirects while allowing USER account-gated
 * actions to resume at the intended protected page after successful login.
 */
function getPostLoginDestination(role, userReturnPath) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "HOST") return "/host/dashboard";

  return userReturnPath || "/user/dashboard";
}

/**
 * Renders the sign-in form and keeps successful authentication synchronized
 * with AuthContext so role-protected routes can read the logged-in user.
 */
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Updates login form state from text and checkbox controls.
   * Checkbox handling is kept explicit because rememberMe uses checked state.
   */
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Calls the existing login service, stores the token/user through AuthContext,
   * and preserves the established role redirects for USER, HOST and ADMIN.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;
      const { token, user: responseUser, ...topLevelUserFields } = data;
      const authenticatedUser = responseUser ?? topLevelUserFields;
      const role = authenticatedUser.role ?? data.role;

      login({
        token,
        user: {
          ...authenticatedUser,
          role,
        },
      });

      navigate(getPostLoginDestination(role, getSafeUserReturnPath(location.state)));
    } catch (err) {
      const message = getAuthErrorMessage(err, "Login failed");

      if (isEmailVerificationError(message)) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="login"
      showBrand
      eyebrow="RETURN TO THE JOURNEY"
      visualTitle="The stay begins before the first door opens."
      visualCopy="Private residences, considered details and a calmer way to choose where the next memory happens."
      visualDetails={["Curated stays", "Verified hosts", "Secure access"]}
    >
      <div className="elite-auth-form">
        <div className="elite-auth-form__intro">
          <p className="elite-auth-form__eyebrow">WELCOME BACK</p>
          <h1>Your next stay is waiting.</h1>
          <p>
            Sign in to continue discovering exceptional places selected with
            care.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="elite-auth-form__fields">
          <div className="elite-auth-form__field">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="elite-auth-form__input"
              required
            />
          </div>

          <div className="elite-auth-form__field">
            <label htmlFor="password">Password</label>

            <div className="elite-auth-form__password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="elite-auth-form__input"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="elite-auth-form__reveal"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="elite-auth-form__row">
            <label className="elite-auth-form__checkbox">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="elite-auth-form__link"
            >
              Forgot password?
            </Link>
          </div>

          {error ? (
            <p className="elite-auth-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="elite-auth-form__submit"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="elite-auth-form__switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

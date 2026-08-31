import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import registerVisualImage from "../../assets/home/story-coastal-dusk.jpg";
import AuthLayout from "../../components/auth/AuthLayout";
import GoogleIcon from "../../components/auth/GoogleIcon";
import { authService } from "../../services/authService";

/**
 * Renders the account creation form while preserving the existing registration
 * payload and verify-email redirect contract.
 */
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "USER",
  });

  /**
   * Updates account-creation fields by name so the payload shape remains
   * compatible with authService.register.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /**
   * Uses the existing auth service and preserves the current post-register
   * verify-email navigation behavior.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await authService.register(formData);

      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="register"
      showBrand
      eyebrow="BEGIN WITH THE PLACE"
      visualTitle="Start somewhere extraordinary."
      visualCopy="Create your account for saved stays, smoother bookings and homes selected for atmosphere as much as address."
      visualDetails={["Guest access", "Host ready", "Curated search"]}
      visualImage={registerVisualImage}
      visualAlt="Infinity pool overlooking the coastline at dusk"
    >
      <div className="elite-auth-form">
        <div className="elite-auth-form__intro">
          <p className="elite-auth-form__eyebrow">JOIN ELITEBNB</p>
          <h1>Start somewhere extraordinary.</h1>
          <p>
            Create your account to save remarkable residences and continue
            booking with confidence.
          </p>
        </div>

        <div className="elite-auth-form__access-options">
          <button
            type="button"
            className="elite-auth-form__google"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="elite-auth-form__divider">
            <span>OR</span>
          </div>
        </div>

        {error ? (
          <p className="elite-auth-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="elite-auth-form__fields">
          <div className="elite-auth-form__split">
            <div className="elite-auth-form__field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                placeholder="Ada"
                value={formData.firstName}
                onChange={handleChange}
                className="elite-auth-form__input"
              />
            </div>

            <div className="elite-auth-form__field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                placeholder="Okafor"
                value={formData.lastName}
                onChange={handleChange}
                className="elite-auth-form__input"
              />
            </div>
          </div>

          <div className="elite-auth-form__field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="elite-auth-form__input"
            />
          </div>

          <div className="elite-auth-form__field">
            <label htmlFor="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="+234 800 000 0000"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="elite-auth-form__input"
            />
          </div>

          <div className="elite-auth-form__field">
            <label htmlFor="role">Account type</label>
            <div className="elite-auth-form__select-shell">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="elite-auth-form__select"
              >
                <option value="USER">User</option>
                <option value="HOST">Host</option>
              </select>
              <ChevronDown
                className="elite-auth-form__select-icon"
                size={17}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="elite-auth-form__field">
            <label htmlFor="register-password">Password</label>
            <div className="elite-auth-form__password">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="elite-auth-form__input"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="elite-auth-form__reveal"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="elite-auth-form__submit"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="elite-auth-form__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

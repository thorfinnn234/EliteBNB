import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { hostOnboardingService } from "../../services/hostOnboardingService";

const TOTAL_STEPS = 11;

const INITIAL_FORM = {
  phoneNumber: "",
  bio: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
};

export default function HostOnboarding() {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.user;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState("");

  const getOnboardingError = (err) => {
    if (err?.response?.status === 403) {
      return "This hosting setup is only available to host accounts. Please log in with a host account or create an account as a Host.";
    }

    return (
      err?.response?.data?.message ||
      err?.response?.data ||
      "We couldn't save your progress."
    );
  };

  const canUseHostOnboarding = () => {
    const role = currentUser?.role?.toUpperCase();

    return !role || role === "HOST" || role === "ADMIN";
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await hostOnboardingService.get();
      const data = response.data;

      /*
       * Existing hosts who already completed onboarding
       * should not be forced through it again.
       */
      if (data.hostOnboardingCompleted) {
        navigate("/host/dashboard", {
          replace: true,
        });
        return;
      }

      setForm({
        phoneNumber: data.phoneNumber || "",
        bio: data.bio || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "Nigeria",
      });

      setStep(
        Math.max(
          1,
          Math.min(
            Number(data.hostOnboardingStep) || 1,
            TOTAL_STEPS
          )
        )
      );
    } catch (err) {
      console.error(
        "Failed to load host onboarding:",
        err
      );

      setError(
        getOnboardingError(err) ||
          "We couldn't load your hosting setup."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Location detection is not supported by this browser.");
      return;
    }

    setDetectingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            throw new Error("Unable to resolve address.");
          }

          const data = await response.json();
          const address = data.address || {};

          setForm((current) => ({
            ...current,
            address:
              data.display_name ||
              current.address ||
              `${latitude}, ${longitude}`,
            city:
              address.city ||
              address.town ||
              address.village ||
              address.suburb ||
              current.city,
            state:
              address.state ||
              address.region ||
              current.state,
            country: address.country || current.country,
          }));
        } catch (locationError) {
          console.error("Failed to detect address:", locationError);

          setForm((current) => ({
            ...current,
            address: current.address || `${latitude}, ${longitude}`,
          }));

          setError(
            "We detected your coordinates, but couldn't fill the full address. Please complete it manually."
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (locationError) => {
        console.error("Location permission failed:", locationError);

        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Please allow location access to detect your address."
            : "We couldn't detect your location. Please enter your address manually."
        );

        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  };

  const saveProgress = async (nextStep = step) => {
    return hostOnboardingService.save({
      phoneNumber: form.phoneNumber.trim(),
      bio: form.bio.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      currentStep: nextStep,
    });
  };

  const validateCurrentStep = () => {
    if (step === 2) {
      if (!form.phoneNumber.trim()) {
        setError(
          "Please enter your phone number before continuing."
        );
        return false;
      }
    }

    if (step === 3) {
      if (!form.address.trim()) {
        setError("Please enter your address.");
        return false;
      }

      if (!form.city.trim()) {
        setError("Please enter your city.");
        return false;
      }

      if (!form.state.trim()) {
        setError("Please enter your state.");
        return false;
      }

      if (!form.country.trim()) {
        setError("Please select your country.");
        return false;
      }
    }

    return true;
  };

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!canUseHostOnboarding()) {
      setError(
        "This hosting setup is only available to host accounts. Please log in with a host account or create an account as a Host."
      );
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = Math.min(
      step + 1,
      TOTAL_STEPS
    );
    const isFinalSetupStep = step === TOTAL_STEPS;

    /*
     * Steps 1-3 contain actual Host information.
     * Save it before entering the listing setup.
     */
    if (step === 2 || step === 3) {
      try {
        setSaving(true);
        setError("");

        await saveProgress(nextStep);

        if (isFinalSetupStep) {
          navigate("/host/dashboard");
        } else {
          setStep(nextStep);
        }
      } catch (err) {
        console.error(
          "Failed to save onboarding:",
          err
        );

        setError(
          getOnboardingError(err)
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    /*
     * For the remaining steps, remember the
     * current position as the host progresses.
     */
    try {
      setSaving(true);
      setError("");

      await saveProgress(nextStep);

      if (isFinalSetupStep) {
        navigate("/host/dashboard");
      } else {
        setStep(nextStep);
      }
    } catch (err) {
      console.error(
        "Failed to save onboarding step:",
        err
      );

      setError(
        getOnboardingError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (step <= 1 || saving) {
      return;
    }

    const previousStep = step - 1;

    setStep(previousStep);

    /*
     * Updating this isn't essential to navigating
     * backwards, so we don't block the UI if it fails.
     */
    try {
      await saveProgress(previousStep);
    } catch (err) {
      console.error(
        "Failed to save previous onboarding step:",
        err
      );
    }
  };

  const handleSaveAndExit = async () => {
    if (!canUseHostOnboarding()) {
      setError(
        "This hosting setup is only available to host accounts. Please log in with a host account or create an account as a Host."
      );
      return;
    }

    /*
     * Host must finish personal details and address
     * before Save & Exit is available.
     */
    if (step < 4) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await saveProgress(step);

      navigate("/host/dashboard");
    } catch (err) {
      console.error(
        "Failed to save onboarding:",
        err
      );

      setError(
        getOnboardingError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4A72C]" />

          <p className="mt-4 text-sm font-semibold text-[#64748B]">
            Preparing your hosting journey...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#FAF9F6]">
      {/* TOP BAR */}
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xl font-black tracking-tight text-[#172554]"
          >
            Elite
            <span className="text-[#D4A72C]">
              BNB
            </span>
          </button>

          <div className="flex items-center gap-3">
            {step >= 4 && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAndExit}
                className="rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-bold text-[#172554] transition hover:border-[#172554] disabled:opacity-50"
              >
                Save & Exit
              </button>
            )}

            <div className="hidden rounded-full bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#64748B] sm:block">
              Host setup
            </div>
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      {step > 1 && (
        <div className="h-1 bg-[#E5E7EB]">
          <div
            className="h-full bg-[#D4A72C] transition-all duration-500"
            style={{
              width: `${
                ((step - 1) /
                  (TOTAL_STEPS - 1)) *
                100
              }%`,
            }}
          />
        </div>
      )}

      {/* CONTENT */}
      <section className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
          {step > 1 && (
            <p className="mb-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4A72C]">
              Step {step - 1} of {TOTAL_STEPS - 1}
            </p>
          )}

          {error && (
            <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {String(error)}
            </div>
          )}

          {step === 1 && (
            <WelcomeStep />
          )}

          {step === 2 && (
            <PersonalDetailsStep
              form={form}
              onChange={handleChange}
            />
          )}

          {step === 3 && (
            <AddressStep
              form={form}
              onChange={handleChange}
              detectingLocation={detectingLocation}
              onDetectLocation={handleDetectLocation}
            />
          )}

          {step === 4 && (
            <ListingIntroductionStep />
          )}

          {step >= 5 && (
            <ComingListingStep step={step} />
          )}
        </div>
      </section>

      {/* BOTTOM NAVIGATION */}
      <footer className="sticky bottom-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div>
            {step > 1 && (
              <button
                type="button"
                disabled={saving}
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-[#172554] underline decoration-[#172554]/30 underline-offset-4 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleContinue}
            className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl bg-[#172554] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1E3A8A] disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : step === 1 ? (
              <>
                Get started
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </main>
  );
}

function WelcomeStep() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4A72C]/10 text-[#D4A72C]">
          <Sparkles className="h-7 w-7" />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
          Welcome to hosting
        </p>

        <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-[#172554] sm:text-5xl lg:text-6xl">
          Turn your space into somewhere worth
          discovering.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-8 text-[#64748B] sm:text-lg">
          We'll guide you through the essentials,
          learn a little about you, and help you
          publish your first EliteBNB stay.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-lg">
        <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-[#D4A72C]/10 blur-2xl" />

        <div className="relative overflow-hidden rounded-[32px] bg-[#172554] p-8 text-white shadow-2xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
            Your journey
          </p>

          <div className="mt-8 space-y-7">
            <JourneyItem
              number="01"
              title="Tell us about you"
              description="A few details help build trust."
            />

            <JourneyItem
              number="02"
              title="Show us your place"
              description="We'll guide you through your first listing."
            />

            <JourneyItem
              number="03"
              title="Welcome your first guest"
              description="Publish when everything looks right."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalDetailsStep({
  form,
  onChange,
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <StepIcon icon={UserRound} />

      <h1 className="mt-6 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">
        Let's get to know you.
      </h1>

      <p className="mt-3 text-base leading-7 text-[#64748B]">
        Guests feel more comfortable when they know
        who's behind the place they're booking.
      </p>

      <div className="mt-9 space-y-6">
        <div>
          <label className="text-sm font-bold text-[#172554]">
            Phone number
          </label>

          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            type="tel"
            placeholder="+234 801 234 5678"
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-5 py-4 text-[#111827] outline-none transition focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10"
          />

          <p className="mt-2 text-xs text-[#94A3B8]">
            Used for important hosting and reservation
            updates.
          </p>
        </div>

        <div>
          <div className="flex justify-between gap-4">
            <label className="text-sm font-bold text-[#172554]">
              Tell guests a little about yourself
            </label>

            <span className="text-xs text-[#94A3B8]">
              {form.bio.length}/1000
            </span>
          </div>

          <textarea
            name="bio"
            value={form.bio}
            onChange={onChange}
            maxLength={1000}
            rows={5}
            placeholder="A little about you, what you enjoy, or what kind of host you'd like to be..."
            className="mt-2 w-full resize-none rounded-2xl border border-[#D1D5DB] bg-white p-5 text-[#111827] outline-none transition focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10"
          />
        </div>
      </div>
    </div>
  );
}

function AddressStep({
  form,
  onChange,
  detectingLocation,
  onDetectLocation,
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <StepIcon icon={MapPin} />

      <h1 className="mt-6 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">
        Where do you live?
      </h1>

      <p className="mt-3 text-base leading-7 text-[#64748B]">
        Add a valid residential address. This helps us
        maintain a trusted hosting community.
      </p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F8FAFC] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A72C]" />

        <p className="text-sm leading-6 text-[#64748B]">
          Your residential address is account information.
          It won't automatically become the address of
          your listing.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <button
          type="button"
          disabled={detectingLocation}
          onClick={onDetectLocation}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4A72C] bg-white px-5 py-4 text-sm font-extrabold text-[#172554] transition hover:bg-[#FFF8E1] disabled:cursor-wait disabled:opacity-60 sm:w-fit"
        >
          {detectingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting location...
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" />
              Use my current location
            </>
          )}
        </button>

        <div>
          <label className="text-sm font-bold text-[#172554]">
            Street address
          </label>

          <div className="relative mt-2">
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />

            <input
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="Enter your street address"
              className="w-full rounded-2xl border border-[#D1D5DB] bg-white py-4 pl-12 pr-5 text-[#111827] outline-none transition focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AddressField
            label="City"
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="Lekki"
          />

          <AddressField
            label="State / Region"
            name="state"
            value={form.state}
            onChange={onChange}
            placeholder="Lagos"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-[#172554]">
            Country
          </label>

          <select
            name="country"
            value={form.country}
            onChange={onChange}
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-5 py-4 text-[#111827] outline-none transition focus:border-[#D4A72C]"
          >
            <option value="Nigeria">
              Nigeria
            </option>
            <option value="Ghana">
              Ghana
            </option>
            <option value="United Kingdom">
              United Kingdom
            </option>
            <option value="United States">
              United States
            </option>
            <option value="Canada">
              Canada
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ListingIntroductionStep() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4A72C]/10 text-[#D4A72C]">
        <Home className="h-8 w-8" />
      </div>

      <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
        You're ready
      </p>

      <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black tracking-tight text-[#172554] sm:text-5xl">
        Now, let's create your first listing.
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#64748B]">
        We'll take it one step at a time. Tell us what
        kind of place you're hosting, what it offers,
        and what makes it special.
      </p>

      <div className="mx-auto mt-9 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
        <MiniFeature
          number="1"
          text="Describe your place"
        />

        <MiniFeature
          number="2"
          text="Add photos & amenities"
        />

        <MiniFeature
          number="3"
          text="Set your price"
        />
      </div>

      <p className="mt-8 text-sm font-semibold text-[#64748B]">
        From here, you can also Save & Exit and
        continue later.
      </p>
    </div>
  );
}

function ComingListingStep({ step }) {
  const titles = {
    5: "What kind of place are you hosting?",
    6: "Where is your property located?",
    7: "Share some basics about your place.",
    8: "What does your place offer?",
    9: "Show guests what your place looks like.",
    10: "Make your listing stand out.",
    11: "Set your price and publish.",
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4A72C]/10 text-[#D4A72C]">
        <Home className="h-8 w-8" />
      </div>

      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#D4A72C]">
        First listing
      </p>

      <h1 className="mt-3 text-3xl font-black text-[#172554] sm:text-4xl">
        {titles[step]}
      </h1>

      <p className="mt-4 text-[#64748B]">
        This step is ready for us to connect to your
        existing property creation API next.
      </p>
    </div>
  );
}

function JourneyItem({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-black text-[#D4A72C]">
        {number}
      </div>

      <div>
        <h3 className="font-bold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-white/60">
          {description}
        </p>
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4A72C]/10 text-[#D4A72C]">
      <Icon className="h-7 w-7" />
    </div>
  );
}

function AddressField({
  label,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="text-sm font-bold text-[#172554]">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-white px-5 py-4 text-[#111827] outline-none transition focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10"
      />
    </div>
  );
}

function MiniFeature({
  number,
  text,
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172554] text-xs font-black text-white">
        {number}
      </div>

      <p className="mt-3 text-sm font-bold text-[#172554]">
        {text}
      </p>
    </div>
  );
}

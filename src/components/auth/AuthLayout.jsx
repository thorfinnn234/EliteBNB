import authImage from "../../assets/images/auth-property.jpg";

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] grid-cols-1 bg-white lg:grid-cols-[0.82fr_1.18fr]">

        {/* LEFT */}
        <section className="flex items-center justify-center px-8 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-[390px]">
            {children}
          </div>
        </section>

        {/* RIGHT */}
        <section className="relative hidden items-center justify-center px-8 py-10 lg:flex">

          <svg
            width="0"
            height="0"
            className="absolute"
            aria-hidden="true"
          >
            <defs>
              <clipPath
                id="authImageClip"
                clipPathUnits="objectBoundingBox"
              >
                <path
                  d="
                    M 0.18 0
                    L 0.92 0
                    Q 1 0 1 0.08

                    L 1 0.80

                    Q 1 0.86 0.94 0.86

                    L 0.90 0.86

                    Q 0.84 0.86 0.84 0.92

                    Q 0.84 1 0.76 1

                    L 0.08 1

                    Q 0 1 0 0.92

                    L 0 0.18

                    Q 0 0.12 0.06 0.12

                    L 0.10 0.12

                    Q 0.16 0.12 0.16 0.06

                    Q 0.16 0 0.18 0

                    Z
                  "
                />
              </clipPath>
            </defs>
          </svg>

          <div
            className="relative h-[82vh] max-h-[760px] min-h-[620px] w-full overflow-hidden"
            style={{
              clipPath: "url(#authImageClip)",
            }}
          >
            <img
              src={authImage}
              alt="EliteBNB property"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#172554]/25 via-transparent to-black/10" />

            <div className="absolute right-8 top-8 max-w-[300px] text-right">
              <p className="font-[Manrope] text-lg font-semibold leading-snug text-white">
                Discover exceptional stays
                <br />
                with trusted hosts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
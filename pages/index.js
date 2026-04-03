import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";

import styles from "@/styles/Home.module.css";

export default function Home() {
  const router = useRouter();

  const handleStart = async () => {
    await router.push({
      pathname: "/summary",
      query: { reset: "1" },
    });
  };

  return (
    <>
      <Head>
        <title>Skin Condition Finder</title>
        <meta name="description" content="Get an instant skin analysis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/visualdx-logo.png"
              alt="VisualDx"
              width={225}
              height={62}
              priority
            />
          </div>

          <h1 className={styles.title}>
            Get an instant skin<br />
            analysis
          </h1>

          <div className={styles.disclaimerBlock}>
            <p className={styles.disclaimer}>
              This AI-powered tool checks your photo<br />
              for signs of common skin conditions.
            </p>
            <p className={styles.disclaimer}>
              It&apos;s not a diagnosis, but it can help<br />
              you understand how and when to talk to your doctor.
            </p>
          </div>

          <div className={styles.ctaWrap}>
            <button className={styles.cta} onClick={handleStart}>
              <span>Start your skin analysis</span>
              <span className={styles.arrow} aria-hidden>
                →
              </span>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

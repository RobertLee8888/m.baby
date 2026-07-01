import { asset } from "../assets";
import { Logo, Page } from "../components";

function SocialLoginButton({ label, src, onClick }: { label: string; src: string; onClick: () => void }) {
  return (
    <button aria-label={`Login with ${label}`} className="social-login-button" onClick={onClick} type="button">
      <span className="social-login-icon">
        <img alt="" src={asset(src)} />
      </span>
    </button>
  );
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <Page className="login-page">
      <div className="login-hero">
        <Logo />
        <h1>Turn ideas into live investing playbooks in minutes</h1>
        <p>Log in to build, remix, and trade.</p>
      </div>

      <button className="promo-card" onClick={onLogin} type="button">
        <span className="promo-icon">
          <span className="gift-emoji" aria-hidden="true">
            🎁
          </span>
        </span>
        <span>
          <strong>Sign up to unlock 3-day Pro</strong>
          <small>$8 credits · Full data access</small>
        </span>
      </button>

      <button className="email-button" onClick={onLogin} type="button">
        Login with Email
      </button>

      <div className="divider">
        <span />
        <small>or</small>
        <span />
      </div>

      <div className="social-grid">
        {[
          ["Google", "assets/figma/social-google.svg"],
          ["X", "assets/figma/social-x.svg"],
          ["Telegram", "assets/figma/social-telegram.svg"],
          ["Discord", "assets/figma/social-discord.svg"],
        ].map(([label, src]) => (
          <SocialLoginButton key={label} label={label} onClick={onLogin} src={src} />
        ))}
      </div>

      <button className="human-check" onClick={onLogin} type="button">
        <span className="checkbox" />
        <span>Verify you are human</span>
        <span className="cloudflare">
          <span className="cloudflare-row">
            <img alt="" src={asset("assets/figma/cloudflare.svg")} />
            <span>Cloudflare</span>
          </span>
          <small>Privacy · Terms</small>
        </span>
      </button>

      <p className="terms">
        By signing in, you agree to the Terms of Service and Privacy
        <br />
        Policy
      </p>
    </Page>
  );
}

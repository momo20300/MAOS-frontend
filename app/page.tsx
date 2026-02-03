export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'radial-gradient(circle at top, #0b1c3f 0%, #000 70%)',
      color: '#fff',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      position: 'relative',
      paddingBottom: '150px',
    }}>

      <div style={{
        position: 'absolute',
        top: '22px',
        right: '32px',
        display: 'flex',
        gap: '20px',
        fontSize: '14px',
      }}>
        <a href="/login" style={{ color: '#9db7ff', textDecoration: 'none' }}>Log in</a>
        <a href="/pricing" style={{ color: '#9db7ff', textDecoration: 'none' }}>Pricing</a>
      </div>

      <img
        src="/logo_darkmode.png"
        alt="MAOS"
        style={{
          marginTop: '56px',
          width: '180px',
          height: 'auto',
        }}
      />

      <div style={{
        marginTop: '74px',
        fontSize: '29px',
        lineHeight: '58px',
        fontWeight: 600,
        textAlign: 'center',
      }}>
        Multi Agent Operating System<br />
        upload &amp; diagnostic your files<br />
        Maos analyze, explain, advise<br />
        TALK TO YOUR COMPANY<br />
        add new brain
      </div>

      <div style={{
        marginTop: '42px',
        marginBottom: '42px',
      }}>
        <a href="/login" style={{
          background: '#22c55e',
          color: '#fff',
          padding: '18px 48px',
          borderRadius: '10px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '16px',
          display: 'inline-block',
        }}>START WITH MAOS</a>
      </div>

      <div style={{
        fontSize: '19px',
        opacity: 0.85,
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        Maos give you professionnal ERP<br />
        Your company board journal<br />
        Write your business letters<br />
        internal chat groups<br />
        File intelligence
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        background: '#fff',
        color: '#111',
        fontSize: '23px',
        padding: '32px',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        <strong>Stop managing software.</strong><br />
        Start running your company.<br />
        <a href="/login" style={{ color: '#22c55e', marginLeft: '10px', textDecoration: 'none' }}>Log in</a>
        <a href="/talk" style={{ color: '#22c55e', marginLeft: '10px', textDecoration: 'none' }}>Talk to MAOS</a>
      </div>

    </main>
  );
}

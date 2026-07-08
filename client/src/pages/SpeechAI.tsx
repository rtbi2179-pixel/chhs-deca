export default function SpeechAI() {
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 80px)', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <h1 style={{ color: '#fff', fontSize: '48px', marginBottom: '40px', textAlign: 'center' }}>AI Speech Tools</h1>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px' }}>
        {/* Roleplay Event AI */}
        <a 
          href="https://chhsdeca-hn7kwxwp.manus.space" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '300px',
            height: '200px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            padding: '30px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.transform = 'translateY(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎤</div>
          Roleplay Event AI
        </a>

        {/* Written Event AI */}
        <a 
          href="https://chhsdeca-9shazsx7.manus.space/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '300px',
            height: '200px',
            backgroundColor: '#a855f7',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            padding: '30px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#9333ea';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 85, 247, 0.5)';
            e.currentTarget.style.transform = 'translateY(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#a855f7';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✍️</div>
          Written Event AI Grader
        </a>
      </div>
    </div>
  );
}

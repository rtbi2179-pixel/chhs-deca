export default function Practice() {
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 80px)', backgroundColor: '#000' }}>
      <iframe
        src="https://www.decademy.app/practice"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          minHeight: 'calc(100vh - 80px)',
        }}
        title="Decademy Practice"
        allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; display-capture; document-domain; encrypted-media; execution-while-not-rendered; execution-while-out-of-viewport; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; navigation-timing; payment; picture-in-picture; publicKeyCredentials-get; sync-xhr; usb; vr; wake-lock; xr-spatial-tracking"
        allowFullScreen
      />
    </div>
  );
}

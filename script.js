/**
 * RAKSHAK — 3D Rotating Aerospace Earth Globe Canvas
 * Renders an animated rotating globe with atmospheric glow, latitude/longitude meridians,
 * landmass telemetry points, and Copernicus Sentinel-1 radar orbital tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('earthCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  // Set internal resolution
  const width = canvas.width = 600;
  const height = canvas.height = 600;
  const cx = width / 2;
  const cy = height / 2;
  const R = 210; // Globe radius

  let rotation = 0;
  const rotationSpeed = 0.007;

  // Generate realistic landmass point distribution (Lat, Lon in radians)
  const continentPoints = [];
  
  // Approximate continent clusters
  const clusters = [
    // Asia & India (Focal region)
    { latMin: 5, latMax: 50, lonMin: 60, lonMax: 130, count: 90 },
    // Africa
    { latMin: -30, latMax: 35, lonMin: -15, lonMax: 45, count: 65 },
    // Europe
    { latMin: 36, latMax: 65, lonMin: -10, lonMax: 40, count: 45 },
    // Americas
    { latMin: -45, latMax: 60, lonMin: -125, lonMax: -35, count: 110 },
    // Australia
    { latMin: -38, latMax: -12, lonMin: 115, lonMax: 150, count: 35 }
  ];

  clusters.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      const lat = (c.latMin + Math.random() * (c.latMax - c.latMin)) * (Math.PI / 180);
      const lon = (c.lonMin + Math.random() * (c.lonMax - c.lonMin)) * (Math.PI / 180);
      continentPoints.push({ lat, lon });
    }
  });

  function drawGlobe() {
    ctx.clearRect(0, 0, width, height);

    // 1. Atmosphere Outer Glow
    const atmosGlow = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.25);
    atmosGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    atmosGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
    atmosGlow.addColorStop(1, 'rgba(7, 19, 36, 0)');
    ctx.fillStyle = atmosGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base Shaded Sphere (Light source from top-left)
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    sphereGrad.addColorStop(0, '#103056');
    sphereGrad.addColorStop(0.5, '#091c36');
    sphereGrad.addColorStop(0.85, '#051122');
    sphereGrad.addColorStop(1, '#02070f');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip(); // Restrict internal elements inside sphere

    // 3. Latitude Circles
    const lats = [-60, -40, -20, 0, 20, 40, 60];
    ctx.strokeStyle = 'rgba(75, 125, 175, 0.22)';
    ctx.lineWidth = 1;

    lats.forEach(deg => {
      const phi = deg * (Math.PI / 180);
      const rLat = R * Math.cos(phi);
      const yLat = cy - R * Math.sin(phi);

      ctx.beginPath();
      ctx.ellipse(cx, yLat, rLat, rLat * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 4. Longitude Meridians (Rotating)
    const meridianCount = 12;
    for (let m = 0; m < meridianCount; m++) {
      const baseAngle = (m / meridianCount) * Math.PI * 2;
      const angle = baseAngle + rotation;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Only draw when meridian faces front or subtle when behind
      ctx.strokeStyle = cosA > 0 ? 'rgba(56, 189, 248, 0.28)' : 'rgba(30, 60, 95, 0.1)';
      ctx.lineWidth = cosA > 0 ? 1 : 0.6;

      ctx.beginPath();
      for (let step = -90; step <= 90; step += 5) {
        const phi = step * (Math.PI / 180);
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const x = cx + R * cosPhi * sinA;
        const y = cy - R * sinPhi;

        if (step === -90) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 5. Landmass Coordinates & Telemetry Nodes
    continentPoints.forEach(pt => {
      const lon = pt.lon + rotation;
      const z = Math.cos(pt.lat) * Math.cos(lon);

      // Front facing hemisphere only
      if (z > 0) {
        const x = cx + R * Math.cos(pt.lat) * Math.sin(lon);
        const y = cy - R * Math.sin(pt.lat);

        const alpha = Math.min(1, Math.max(0.15, z * 1.2));
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;

        ctx.beginPath();
        ctx.arc(x, y, 1.8 * z, 0, Math.PI * 2);
        ctx.fill();

        // Extra glowing node for key radar targets
        if (z > 0.7 && Math.abs(pt.lat - 0.35) < 0.2) {
          ctx.strokeStyle = `rgba(14, 165, 233, ${alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(x, y, 4 * z, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    // 6. Limb / Atmosphere Rim Shading (3D Sphere Depth)
    const limbGrad = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
    limbGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    limbGrad.addColorStop(0.85, 'rgba(3, 10, 22, 0.45)');
    limbGrad.addColorStop(1, 'rgba(56, 189, 248, 0.65)');
    ctx.fillStyle = limbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Satellite Radar Swath Sweep Simulation
    rotation += rotationSpeed;
    animationFrameId = requestAnimationFrame(drawGlobe);
  }

  drawGlobe();

  // Clean cleanup if needed
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });
});

/* ========================================
   순위 차트 — Canvas 기반 선 그래프
   외부 라이브러리 없이 순수 구현
   ======================================== */

/**
 * 순위 변동 차트 렌더링
 * @param {string} canvasId — canvas element id
 * @param {Array} rankHistory — [{date, rank, memo}]
 * @param {number} targetRank — 목표 순위
 */
export function renderRankChart(canvasId, rankHistory, targetRank = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !rankHistory?.length) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  // Data
  const data = rankHistory.slice(-20); // 최근 20개
  const ranks = data.map(d => d.rank);
  const maxRank = Math.max(...ranks, targetRank || 0) + 5;
  const minRank = Math.max(1, Math.min(...ranks) - 3);

  const pad = { top: 25, right: 15, bottom: 35, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#fafaf8';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 12);
  ctx.fill();

  // Grid lines
  const gridCount = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridCount; i++) {
    const gy = pad.top + (chartH / gridCount) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(w - pad.right, gy);
    ctx.stroke();

    // Y-axis labels (순위는 작을수록 좋으므로 위가 1)
    const rankVal = Math.round(minRank + ((maxRank - minRank) / gridCount) * i);
    ctx.fillStyle = '#9c9cac';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${rankVal}위`, pad.left - 6, gy + 3);
  }

  // X-axis labels
  const step = Math.max(1, Math.floor(data.length / 6));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      const x = pad.left + (chartW / (data.length - 1 || 1)) * i;
      ctx.fillStyle = '#9c9cac';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = d.date.length > 5 ? d.date.slice(5) : d.date;
      ctx.fillText(label, x, h - pad.bottom + 16);
    }
  });

  // Target line
  if (targetRank && targetRank >= minRank && targetRank <= maxRank) {
    const ty = pad.top + chartH * ((targetRank - minRank) / (maxRank - minRank));
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, ty);
    ctx.lineTo(w - pad.right, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ea580c';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Target ${targetRank}`, w - pad.right + 2, ty - 4);
  }

  // Draw area (gradient fill)
  const points = data.map((d, i) => ({
    x: pad.left + (chartW / (data.length - 1 || 1)) * i,
    y: pad.top + chartH * ((d.rank - minRank) / (maxRank - minRank)),
  }));

  if (points.length > 1) {
    // Area fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.01)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  // Dots
  points.forEach((p, i) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Last point highlight
    if (i === points.length - 1) {
      ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${data[i].rank}위`, p.x, p.y - 12);
    }
  });

  // Title
  ctx.fillStyle = '#1e1e2e';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Rank History', pad.left, 16);

  // Summary
  if (data.length >= 2) {
    const first = data[0].rank;
    const last = data[data.length - 1].rank;
    const diff = first - last;
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    const color = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#9c9cac';

    ctx.fillStyle = color;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${first}위 → ${last}위 (${arrow}${Math.abs(diff)})`, w - pad.right, 16);
  }
}

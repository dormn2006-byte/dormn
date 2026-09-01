import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const MacOSDock = ({ apps, onAppClick, openApps = [], className = '' }) => {
  const [mouseX, setMouseX] = useState(null);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [currentScales, setCurrentScales] = useState(apps.map(() => 1));
  const [currentPositions, setCurrentPositions] = useState([]);
  
  const scalesRef = useRef(apps.map(() => 1));
  const positionsRef = useRef([]);
  const dockRef = useRef(null);
  const iconRefs = useRef([]);
  const touchedAppIndexRef = useRef(null);
  const animationFrameRef = useRef(undefined);
  const lastMouseMoveTime = useRef(0);
  const dockRectRef = useRef(null);

  const activeApp = apps.find(app => openApps.includes(app.id));
  const activeAppId = activeApp ? activeApp.id : null;
  const expandedAppId = hoveredApp ? hoveredApp.id : activeAppId;

  const getLabelWidth = () => {
    if (typeof window === 'undefined') return 150;
    const w = window.innerWidth;
    return w < 380 ? 60 : w < 480 ? 70 : w < 1024 ? 80 : 150;
  };

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 56, maxScale: 1.35, effectWidth: 320, baseSpacing: 12, isBottom: true };
    }
    const w = window.innerWidth;
    
    // Dynamically adjust to fit icons cleanly without overflowing
    if (w < 380) return { baseIconSize: 34, maxScale: 1.15, effectWidth: w * 0.4, baseSpacing: 4, isBottom: true };
    if (w < 480) return { baseIconSize: 38, maxScale: 1.2, effectWidth: w * 0.4, baseSpacing: 6, isBottom: true };
    if (w < 768) return { baseIconSize: 48, maxScale: 1.3, effectWidth: w * 0.35, baseSpacing: 8, isBottom: true };
    return { baseIconSize: 56, maxScale: 1.35, effectWidth: 320, baseSpacing: 12, isBottom: true };
  }, []);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth, baseSpacing, isBottom } = config;

  useEffect(() => {
    const h = () => setConfig(getResponsiveConfig());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [getResponsiveConfig]);

  const calculateTargetMagnification = useCallback((mousePosition) => {
    if (mousePosition === null) return apps.map(() => 1);
    return apps.map((_, i) => {
      const center = (i * (baseIconSize + baseSpacing)) + (baseIconSize / 2);
      const minX = mousePosition - (effectWidth / 2);
      const maxX = mousePosition + (effectWidth / 2);
      if (center < minX || center > maxX) return 1;
      const theta = ((center - minX) / effectWidth) * 2 * Math.PI;
      return 1 + ((1 - Math.cos(Math.min(Math.max(theta, 0), 2 * Math.PI))) / 2) * (maxScale - 1);
    });
  }, [apps, baseIconSize, baseSpacing, effectWidth, maxScale]);

  const calculatePositions = useCallback((scales, expandedId) => {
    let x = 0;
    return scales.map((scale, i) => {
      const labelW = apps[i].id === expandedId ? getLabelWidth() : 0;
      const sw = baseIconSize * scale;
      const cx = x + sw / 2;
      x += sw + labelW + baseSpacing;
      return cx;
    });
  }, [apps, baseIconSize, baseSpacing]);

  const animateToTargetRef = useRef();

  useEffect(() => {
    const s = apps.map(() => 1);
    const p = calculatePositions(s, expandedAppId);
    scalesRef.current = s;
    positionsRef.current = p;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentScales(s);
    setCurrentPositions(p);
  }, [apps, calculatePositions, config, expandedAppId]);

  const animateToTarget = useCallback(() => {
    const ts = calculateTargetMagnification(mouseX);
    const tp = calculatePositions(ts, expandedAppId);
    const lf = mouseX !== null ? 0.18 : 0.10;
    let changed = false;

    const ns = scalesRef.current.map((c, i) => {
      const d = ts[i] - c;
      if (Math.abs(d) > 0.001) changed = true;
      return c + d * lf;
    });
    const np = positionsRef.current.map((c, i) => {
      const d = tp[i] - c;
      if (Math.abs(d) > 0.05) changed = true;
      return c + d * lf;
    });

    scalesRef.current = ns;
    positionsRef.current = np;
    if (changed) { setCurrentScales(ns); setCurrentPositions(np); }
    if (changed || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTargetRef.current);
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, expandedAppId]);

  useEffect(() => {
    animateToTargetRef.current = animateToTarget;
  }, [animateToTarget]);

  useEffect(() => {
    if (mouseX !== null) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(animateToTargetRef.current);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [mouseX]);

  const updateDockRect = useCallback(() => {
    if (dockRef.current) dockRectRef.current = dockRef.current.getBoundingClientRect();
  }, []);

  const padding = useMemo(() => Math.max(8, baseIconSize * 0.12), [baseIconSize]);

  const getTouchX = useCallback((clientX) => {
    if (!dockRectRef.current && dockRef.current) updateDockRect();
    return dockRectRef.current ? clientX - dockRectRef.current.left - padding : null;
  }, [padding, updateDockRect]);

  const findClosestApp = useCallback((touchX) => {
    let idx = 0, min = Infinity;
    currentPositions.forEach((pos, i) => {
      const d = Math.abs(pos - touchX);
      if (d < min) { min = d; idx = i; }
    });
    return idx;
  }, [currentPositions]);

  const handleMouseEnter = useCallback(() => updateDockRect(), [updateDockRect]);

  const handleMouseMove = useCallback((e) => {
    const now = performance.now();
    if (now - lastMouseMoveTime.current < 16) return;
    lastMouseMoveTime.current = now;
    const x = getTouchX(e.clientX);
    if (x !== null) setMouseX(x);
  }, [getTouchX]);

  const handleMouseLeave = useCallback(() => {
    dockRectRef.current = null;
    setMouseX(null);
    setHoveredApp(null);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    updateDockRect();
    const x = getTouchX(e.touches[0].clientX);
    if (x !== null) {
      setMouseX(x);
      const idx = findClosestApp(x);
      touchedAppIndexRef.current = idx;
      setHoveredApp(apps[idx]);
    }
  }, [apps, getTouchX, findClosestApp, updateDockRect]);

  const handleTouchMove = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    const x = getTouchX(e.touches[0].clientX);
    if (x !== null) {
      setMouseX(x);
      const idx = findClosestApp(x);
      touchedAppIndexRef.current = idx;
      setHoveredApp(apps[idx]);
    }
  }, [apps, getTouchX, findClosestApp]);

  const clickApp = useCallback((appId, index) => {
    onAppClick(appId);
  }, [onAppClick]);

  const handleTouchEnd = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    if (touchedAppIndexRef.current !== null) clickApp(apps[touchedAppIndexRef.current].id, touchedAppIndexRef.current);
    setMouseX(null);
    setHoveredApp(null);
    touchedAppIndexRef.current = null;
  }, [apps, clickApp]);

  const contentWidth = currentPositions.length > 0
    ? Math.max(...currentPositions.map((pos, i) => {
        const labelW = apps[i].id === expandedAppId ? getLabelWidth() : 0;
        return pos + (baseIconSize * currentScales[i]) / 2 + labelW;
      }))
    : (apps.length * (baseIconSize + baseSpacing)) - baseSpacing;

  const borderRadius = Math.max(16, baseIconSize * 0.5);
  const dockStyle = useMemo(() => ({
    background: isBottom ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
    borderRadius: `${borderRadius}px`,
    border: `1px solid rgba(255,255,255,${isBottom ? 0.5 : 0.6})`,
    boxShadow: isBottom
      ? `0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(16, baseIconSize * 0.4)}px rgba(0,0,0,0.1),0 ${Math.max(2, baseIconSize * 0.05)}px ${Math.max(8, baseIconSize * 0.2)}px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.6)`
      : '0 8px 32px rgba(0,0,0,0.1),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.7)',
    padding: `${padding}px`,
    margin: '0 auto',
    width: 'fit-content',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    backdropFilter: 'blur(24px) saturate(180%)'
  }), [isBottom, borderRadius, baseIconSize, padding]);

  const dotSize = Math.max(4, baseIconSize * 0.08);

  return (
    <div
      ref={dockRef}
      className={`mac-os-dock-container backdrop-blur-xl flex items-center ${className}`}
      style={dockStyle}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative transition-[width] duration-200"
        style={{ height: `${baseIconSize}px`, width: `${contentWidth}px` }}
      >
        {apps.map((app, index) => {
          const scale = currentScales[index];
          const position = currentPositions[index] || 0;
          const sz = baseIconSize * scale;
          const isExp = app.id === expandedAppId;
          const lw = isExp ? getLabelWidth() : 0;

          return (
            <div
              key={app.id}
              ref={el => { iconRefs.current[index] = el; }}
              className="absolute cursor-pointer flex items-center group"
              onClick={() => clickApp(app.id, index)}
              onMouseEnter={() => setHoveredApp(app)}
              style={{
                left: `${position - sz / 2}px`,
                bottom: isBottom ? '0px' : 'auto',
                top: isBottom ? 'auto' : '0px',
                width: `${sz + lw}px`,
                height: `${sz}px`,
                transformOrigin: isBottom ? 'bottom center' : 'top center',
                zIndex: Math.round(scale * 10)
              }}
            >
              <div style={{ width: `${sz}px`, height: `${sz}px` }} className="flex-shrink-0">
                {typeof app.icon === 'string' ? (
                  <img src={app.icon} alt={app.name} className="w-full h-full object-contain drop-shadow-md" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-[#0D3A1D] transition-colors group-hover:bg-[#93B733] group-hover:text-white group-hover:border-[#93B733] [&>svg]:w-3/5 [&>svg]:h-3/5 [&>svg]:transition-colors"
                    style={{ filter: `drop-shadow(0 ${scale > 1.2 ? 4 : 2}px ${scale > 1.2 ? 8 : 4}px rgba(0,0,0,0.1))` }}
                  >
                    {app.icon}
                  </div>
                )}
              </div>

              <div
                className="ml-2 bg-white text-[#4E700F] text-sm sm:text-base font-black rounded-xl shadow-md border border-gray-200/80 flex items-center justify-center h-[40px] lg:h-[56px]"
                style={{
                  width: isExp ? lw - 12 : 0,
                  opacity: isExp ? 1 : 0,
                  transition: 'width 150ms ease-out, opacity 150ms ease-out',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {app.name}
              </div>

              {openApps.includes(app.id) && (
                <div
                  className="absolute"
                  style={{
                    bottom: isBottom ? 'auto' : `${Math.max(-8, -baseIconSize * 0.15)}px`,
                    top: isBottom ? `${Math.max(-8, -baseIconSize * 0.15)}px` : 'auto',
                    left: `${sz / 2}px`,
                    transform: 'translateX(-50%)',
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    borderRadius: '50%',
                    backgroundColor: '#93B733',
                    boxShadow: '0 0 6px rgba(147,183,51,0.4)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MacOSDock;

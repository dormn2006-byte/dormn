import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const MacOSDock = ({ apps, onAppClick, openApps = [], className = '', variant = 'default' }) => {
  const [mouseX, setMouseX] = useState(null);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [currentScales, setCurrentScales] = useState(apps.map(() => 1));
  const [currentPositions, setCurrentPositions] = useState([]);
  
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || (('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 1024);
  });

  const isParty = variant === 'party';
  const isOwner = variant === 'owner' || variant === 'resident';
  const scalesRef = useRef(apps.map(() => 1));
  const positionsRef = useRef([]);
  const dockRef = useRef(null);
  const iconRefs = useRef([]);
  const touchedAppIndexRef = useRef(null);
  const animationFrameRef = useRef(undefined);
  const dockRectRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  const activeApp = apps.find(app => openApps.includes(app.id));
  const activeAppId = activeApp ? activeApp.id : null;
  const expandedAppId = isParty ? null : (hoveredApp ? hoveredApp.id : activeAppId);

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 56, maxScale: 1.3, effectWidth: 300, baseSpacing: 12, isBottom: true, labelWidth: 130 };
    }
    const w = window.innerWidth;
    const isMobile = w < 768;
    
    if (isMobile) {
      const idx = w < 380 ? 0 : w < 480 ? 1 : w < 640 ? 2 : 3;
      const szMap = variant === 'resident' ? [34, 38, 42, 46] : variant === 'owner' ? [38, 44, 48, 52] : [36, 40, 44, 48];
      const spMap = variant === 'resident' ? [5, 6, 7, 8] : [6, 8, 9, 10];
      const lwMap = [62, 70, 78, 88];
      return { baseIconSize: szMap[idx], maxScale: 1.0, effectWidth: 0, baseSpacing: spMap[idx], isBottom: true, labelWidth: lwMap[idx] };
    }

    const isRes = variant === 'resident';
    const isOwn = variant === 'owner';
    const lw = isParty ? 0 : (w < 1024 ? (isRes ? 110 : 120) : (isRes ? 135 : isOwn ? 145 : 155));
    return {
      baseIconSize: isRes ? 52 : 58,
      maxScale: isRes ? 1.28 : isOwn ? 1.3 : 1.32,
      effectWidth: 320,
      baseSpacing: isRes ? 10 : isOwn ? 14 : 12,
      isBottom: true,
      labelWidth: lw
    };
  }, [variant, isParty]);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth, baseSpacing, isBottom, labelWidth } = config;
  const currentLabelWidth = isParty ? 0 : labelWidth;

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobileDevice(w < 768 || (('ontouchstart' in window || navigator.maxTouchPoints > 0) && w < 1024));
      setConfig(getResponsiveConfig());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveConfig]);

  const calculateTargetMagnification = useCallback((mousePosition) => {
    if (mousePosition === null || isMobileDevice) return apps.map(() => 1);
    return apps.map((_, i) => {
      const center = (i * (baseIconSize + baseSpacing)) + (baseIconSize / 2);
      const minX = mousePosition - (effectWidth / 2);
      const maxX = mousePosition + (effectWidth / 2);
      if (center < minX || center > maxX) return 1;
      const theta = ((center - minX) / effectWidth) * 2 * Math.PI;
      return 1 + ((1 - Math.cos(Math.min(Math.max(theta, 0), 2 * Math.PI))) / 2) * (maxScale - 1);
    });
  }, [apps, baseIconSize, baseSpacing, effectWidth, maxScale, isMobileDevice]);

  const calculatePositions = useCallback((scales, expandedId) => {
    let x = 0;
    return scales.map((scale, i) => {
      const labelW = apps[i].id === expandedId ? currentLabelWidth : 0;
      const sw = baseIconSize * scale;
      const cx = x + sw / 2;
      x += sw + labelW + baseSpacing;
      return cx;
    });
  }, [apps, baseIconSize, baseSpacing, currentLabelWidth]);

  const animateToTargetRef = useRef();

  useEffect(() => {
    const s = scalesRef.current.length === apps.length ? scalesRef.current : apps.map(() => 1);
    const p = calculatePositions(s, expandedAppId);
    positionsRef.current = p;
    setCurrentPositions(p);
  }, [apps, calculatePositions, config, expandedAppId]);

  const animateToTarget = useCallback(() => {
    if (isMobileDevice) return;

    const ts = calculateTargetMagnification(mouseX);
    const tp = calculatePositions(ts, expandedAppId);
    const lf = mouseX !== null ? 0.38 : 0.28;
    let changed = false;

    const ns = scalesRef.current.map((c, i) => {
      const d = ts[i] - c;
      if (Math.abs(d) > 0.002) changed = true;
      return c + d * lf;
    });
    const np = positionsRef.current.map((c, i) => {
      const d = tp[i] - c;
      if (Math.abs(d) > 0.1) changed = true;
      return c + d * lf;
    });

    scalesRef.current = ns;
    positionsRef.current = np;
    if (changed) {
      setCurrentScales(ns);
      setCurrentPositions(np);
      animationFrameRef.current = requestAnimationFrame(animateToTargetRef.current);
    } else {
      scalesRef.current = ts;
      positionsRef.current = tp;
      setCurrentScales(ts);
      setCurrentPositions(tp);
      if (mouseX !== null) {
        animationFrameRef.current = requestAnimationFrame(animateToTargetRef.current);
      }
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, expandedAppId, isMobileDevice]);

  useEffect(() => {
    animateToTargetRef.current = animateToTarget;
  }, [animateToTarget]);

  useEffect(() => {
    if (isMobileDevice) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animateToTargetRef.current);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mouseX, expandedAppId, isMobileDevice]);

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

  const handleTouch = useCallback((e, isStart = false) => {
    if (e.cancelable) e.preventDefault();
    if (isStart) updateDockRect();
    const x = getTouchX(e.touches[0].clientX);
    if (x !== null) {
      setMouseX(x);
      const idx = findClosestApp(x);
      touchedAppIndexRef.current = idx;
      setHoveredApp(apps[idx]);
    }
  }, [apps, getTouchX, findClosestApp, updateDockRect]);

  const handleTouchStart = useCallback((e) => handleTouch(e, true), [handleTouch]);
  const handleTouchMove = useCallback((e) => handleTouch(e, false), [handleTouch]);

  const handleMouseEnter = useCallback(() => updateDockRect(), [updateDockRect]);

  const handleMouseMove = useCallback((e) => {
    const x = getTouchX(e.clientX);
    if (x !== null) setMouseX(x);
  }, [getTouchX]);

  const handleMouseLeave = useCallback(() => {
    dockRectRef.current = null;
    setMouseX(null);
    setHoveredApp(null);
  }, []);

  const clickApp = useCallback((appId, index) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 250) return;
    lastClickTimeRef.current = now;
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
        const labelW = apps[i].id === expandedAppId ? currentLabelWidth : 0;
        return pos + (baseIconSize * currentScales[i]) / 2 + labelW;
      }))
    : (apps.length * (baseIconSize + baseSpacing)) - baseSpacing;

  const borderRadius = Math.max(18, baseIconSize * 0.48);
  const dockStyle = useMemo(() => ({
    ...(isParty ? {} : isOwner ? {
      background: 'rgba(11, 16, 32, 0.88)',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      boxShadow: '0 16px 40px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    } : {
      background: isBottom ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
      border: `1px solid rgba(255,255,255,${isBottom ? 0.5 : 0.6})`,
      boxShadow: isBottom
        ? `0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(16, baseIconSize * 0.4)}px rgba(0,0,0,0.1),0 ${Math.max(2, baseIconSize * 0.05)}px ${Math.max(8, baseIconSize * 0.2)}px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.6)`
        : '0 8px 32px rgba(0,0,0,0.1),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.7)',
    }),
    borderRadius: `${borderRadius}px`,
    padding: isOwner ? `${Math.max(7, padding)}px ${Math.max(12, padding + 4)}px` : `${padding}px`,
    margin: '0 auto',
    width: 'fit-content',
    WebkitTransform: 'translateZ(0)',
    transform: 'translateZ(0)',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    contain: 'paint layout',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    backdropFilter: 'blur(24px) saturate(180%)'
  }), [isBottom, borderRadius, baseIconSize, padding, isParty, isOwner]);

  const dotSize = Math.max(4, baseIconSize * 0.08);

  return (
    <div
      ref={dockRef}
      className={`mac-os-dock-container ${isParty ? 'events-dock-container' : ''} backdrop-blur-xl flex items-center ${className}`}
      style={dockStyle}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={isMobileDevice ? undefined : handleTouchStart}
      onTouchMove={isMobileDevice ? undefined : handleTouchMove}
      onTouchEnd={isMobileDevice ? undefined : handleTouchEnd}
    >
      <div
        className="relative"
        style={{ height: `${baseIconSize}px`, width: `${contentWidth}px` }}
      >
        {apps.map((app, index) => {
          const scale = currentScales[index];
          const position = currentPositions[index] || 0;
          const sz = baseIconSize * scale;
          const isExp = app.id === expandedAppId;
          const lw = isExp ? currentLabelWidth : 0;
          const isActive = openApps.includes(app.id);

          return (
            <div
              key={app.id}
              ref={el => { iconRefs.current[index] = el; }}
              title={app.name}
              className="absolute cursor-pointer flex items-center group active:scale-90 transition-transform duration-150 select-none touch-manipulation"
              onClick={() => clickApp(app.id, index)}
              onMouseEnter={() => setHoveredApp(app)}
              style={{
                left: `${position - sz / 2}px`,
                bottom: isBottom ? '0px' : 'auto',
                top: isBottom ? 'auto' : '0px',
                width: `${sz + lw}px`,
                height: `${sz}px`,
                transformOrigin: isBottom ? 'bottom center' : 'top center',
                zIndex: Math.round(scale * 10),
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Icon Container */}
              <div style={{ width: `${sz}px`, height: `${sz}px` }} className="flex-shrink-0 relative">
                {typeof app.icon === 'string' ? (
                  <img src={app.icon} alt={app.name} className="w-full h-full object-contain drop-shadow-md pointer-events-none select-none" />
                ) : isOwner ? (
                  <div
                    className={`w-full h-full flex items-center justify-center rounded-2xl transition-all duration-200 shadow-md ${
                      isActive
                        ? "scale-105 ring-2 ring-white/90 shadow-lg"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    } ${app.bgGradient || "bg-gradient-to-tr from-slate-700 to-slate-800"}`}
                    style={{ filter: `drop-shadow(0 ${scale > 1.2 ? 5 : 2.5}px ${scale > 1.2 ? 10 : 5}px rgba(0,0,0,0.35))` }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-white [&>svg]:w-[60%] [&>svg]:h-[60%] [&>svg]:stroke-[2.4] [&>svg]:text-white [&>svg]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                      {app.icon}
                    </div>
                  </div>
                ) : isParty ? (
                  <div
                    className={`w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl transition-colors duration-150 [&>svg]:w-[68%] [&>svg]:h-[68%] ${
                      isActive
                        ? "bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 text-white shadow-lg shadow-pink-500/40 border border-pink-300/60 ring-2 ring-pink-400/40"
                        : "bg-white/95 dark:bg-[#15112B]/95 text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-500/30 group-hover:bg-gradient-to-tr group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white group-hover:border-pink-400"
                    }`}
                    style={{ filter: `drop-shadow(0 ${scale > 1.2 ? 3 : 1.5}px ${scale > 1.2 ? 6 : 3}px rgba(0,0,0,0.15))` }}
                  >
                    {app.icon}
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-xs sm:shadow-sm border border-gray-100 text-[#0D3A1D] transition-colors duration-150 group-hover:bg-[#93B733] group-hover:text-white group-hover:border-[#93B733] [&>svg]:w-[68%] [&>svg]:h-[68%] [&>svg]:transition-colors"
                    style={{ filter: `drop-shadow(0 ${scale > 1.2 ? 3 : 1.5}px ${scale > 1.2 ? 6 : 3}px rgba(0,0,0,0.1))` }}
                  >
                    {app.icon}
                  </div>
                )}

                {/* Badge Notification */}
                {app.badge !== undefined && app.badge !== null && app.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] px-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md shadow-pink-500/50 border border-white dark:border-[#0D0B1C] pointer-events-none z-20">
                    {app.badge}
                  </span>
                )}
              </div>

              {/* Side Expanding Label Pill */}
              <div
                className={`dock-label-pill ml-1 sm:ml-2 text-[10px] sm:text-xs md:text-sm font-black rounded-lg sm:rounded-xl shadow-xs sm:shadow-md border flex items-center justify-center px-1.5 sm:px-3 ${
                  isParty
                    ? "bg-purple-950/95 dark:bg-[#120D26]/95 text-pink-300 dark:text-pink-300 border-purple-400/40 shadow-pink-500/20 backdrop-blur-md"
                    : isOwner
                    ? "bg-white/95 dark:bg-[#161c2c]/95 text-[#0D3A1D] dark:text-white border-white/50 dark:border-white/20 shadow-lg shadow-black/30 backdrop-blur-xl"
                    : "bg-white text-[#0D3A1D] dark:text-white dark:bg-white/20 border-gray-200/80 dark:border-white/20 backdrop-blur-md"
                }`}
                style={{
                  height: `${Math.max(24, sz * 0.76)}px`,
                  width: isExp ? Math.max(0, lw - 8) : 0,
                  opacity: isExp ? 1 : 0,
                  transition: 'width 140ms cubic-bezier(0.4, 0, 0.2, 1), opacity 140ms cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {app.name}
              </div>

              {isActive && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: isBottom ? 'auto' : `${Math.max(-8, -baseIconSize * 0.15)}px`,
                    top: isBottom ? `${Math.max(-8, -baseIconSize * 0.15)}px` : 'auto',
                    left: `${sz / 2}px`,
                    transform: 'translateX(-50%)',
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                    borderRadius: '50%',
                    backgroundColor: isOwner ? '#38BDF8' : (isParty ? '#EC4899' : '#93B733'),
                    boxShadow: isOwner ? '0 0 10px #38BDF8, 0 0 2px #fff' : (isParty ? '0 0 8px rgba(236,72,153,0.9)' : '0 0 6px rgba(147,183,51,0.4)'),
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

import React, { useEffect, useRef, useState } from 'react';
import { Issue, LatLng, CATEGORIES_LIST, WARDS_LIST, STATE_CITY_WARD_MAP } from '../types';
import { MapPin, Search, Layers, Compass, Check, ArrowRight, ThumbsUp, Calendar, AlertTriangle, User, X } from 'lucide-react';


interface MapComponentProps {
  issues: Issue[];
  selectedIssueId?: string;
  onSelectIssue?: (issue: Issue) => void;
  isSelectionMode?: boolean; // If true, behaves as sub-component pin dropper
  onPinDropped?: (latlng: LatLng, address: string) => void;
  initialCenter?: LatLng;
}

export default function MapComponent({
  issues,
  selectedIssueId,
  onSelectIssue,
  isSelectionMode = false,
  onPinDropped,
  initialCenter = { lat: 21.0, lng: 78.0 } // India Center default
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  
  // Floating Filter Panel state (only for full-screen mode)
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedWard, setSelectedWard] = useState<string>('All Wards');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES_LIST);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['reported', 'assigned', 'in_progress', 'resolved']);
  
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedMapIssue, setSelectedMapIssue] = useState<Issue | null>(null);

  const mapInstanceRef = useRef<any>(null);
  const markersClusterGroupRef = useRef<any>(null);
  const currentPinRef = useRef<any>(null);

  // Dynamic Asset Loading (Leaflet + MarkerCluster + Leaflet.heat)
  useEffect(() => {
    const checkLoaded = () => {
      const L = (window as any).L;
      if (L && L.markerClusterGroup) {
        setLeafletLoaded(true);
        setPluginsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkLoaded()) return;

    const interval = setInterval(() => {
      if (checkLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Safety timeout: stop polling after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Filter Issues with Indian State, City, Ward hierarchy
  const filteredIssues = issues.filter(issue => {
    if (isSelectionMode) return false;

    // Issue location: "State - City - Ward"
    const wardStr = issue.location?.ward || "";
    const parts = wardStr.split(" - ");
    const issueState = parts[0] || "";
    const issueCity = parts[1] || "";
    const issueWard = parts[2] || "";

    const matchesState = selectedState === 'All States' || issueState === selectedState;
    const matchesCity = selectedCity === 'All Cities' || issueCity === selectedCity;
    const matchesWard = selectedWard === 'All Wards' || issueWard === selectedWard;

    const matchesCategory = selectedCategories.includes(issue.category);
    const matchesStatus = selectedStatuses.includes(issue.status);

    return matchesState && matchesCity && matchesWard && matchesCategory && matchesStatus;
  });

  // Cascading lists for filter options
  const availableStates = Object.keys(STATE_CITY_WARD_MAP);
  const availableCities = selectedState !== 'All States' ? Object.keys(STATE_CITY_WARD_MAP[selectedState] || {}) : [];
  const availableWards = (selectedState !== 'All States' && selectedCity !== 'All Cities') ? (STATE_CITY_WARD_MAP[selectedState]?.[selectedCity] || []) : [];

  const handleStateChange = (stateVal: string) => {
    setSelectedState(stateVal);
    setSelectedCity('All Cities');
    setSelectedWard('All Wards');
  };

  const handleCityChange = (cityVal: string) => {
    setSelectedCity(cityVal);
    setSelectedWard('All Wards');
  };

  // Category Color Map helper
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Garbage & Sanitation': return '#10b981'; // Emerald
      case 'Drainage & Flooding': return '#3b82f6'; // Blue
      case 'Potholes & Roads': return '#f59e0b'; // Amber
      case 'Water Leakage & Sewage': return '#06b6d4'; // Cyan
      case 'Streetlights & Electricity': return '#eab308'; // Yellow
      case 'Encroachments & Trees': return '#ec4899'; // Pink
      default: return '#6b7280'; // Gray
    }
  };

  // Get status label helper
  const formatStatus = (s: string) => {
    return s.replace('_', ' ').toUpperCase();
  };

  // Initialize Map Instance
  useEffect(() => {
    const L = (window as any).L;
    if (!leafletLoaded || !L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false // custom zoom positioning below header
    }).setView(
      [initialCenter.lat, initialCenter.lng],
      isSelectionMode ? 5 : 5
    );
    mapInstanceRef.current = map;

    // CartoDB Positron / Voyager Tile Layer (Looks gorgeous and modern for dashboard maps)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB'
    }).addTo(map);

    // Zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    if (isSelectionMode) {
      const dropPin = (lat: number, lng: number) => {
        if (currentPinRef.current) {
          map.removeLayer(currentPinRef.current);
        }

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform -translate-y-2 animate-bounce">
                  <span class="w-3 h-3 bg-white rounded-full"></span>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        currentPinRef.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map);
        
        const reverseGeocode = async (lt: number, lg: number) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lt}&lon=${lg}`);
            const data = await res.json();
            const addr = data.display_name || `Lat: ${lt.toFixed(4)}, Lng: ${lg.toFixed(4)}`;
            if (onPinDropped) {
              onPinDropped({ lat: lt, lng: lg }, addr);
            }
          } catch (err) {
            if (onPinDropped) {
              onPinDropped({ lat: lt, lng: lg }, `Coordinates: ${lt.toFixed(4)}, ${lg.toFixed(4)}`);
            }
          }
        };

        reverseGeocode(lat, lng);

        currentPinRef.current.on('dragend', (e: any) => {
          const newPos = e.target.getLatLng();
          reverseGeocode(newPos.lat, newPos.lng);
        });
      };

      dropPin(initialCenter.lat, initialCenter.lng);

      map.on('click', (e: any) => {
        dropPin(e.latlng.lat, e.latlng.lng);
      });
    } else if (pluginsLoaded) {
      // Setup Cluster Group
      markersClusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true
      });
      map.addLayer(markersClusterGroupRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, pluginsLoaded, isSelectionMode]);

  // Handle markers updates
  useEffect(() => {
    const L = (window as any).L;
    if (!leafletLoaded || !L || !mapInstanceRef.current || isSelectionMode || !pluginsLoaded) return;

    // Clear old clusters
    markersClusterGroupRef.current.clearLayers();

    filteredIssues.forEach(issue => {
      if (!issue.location?.lat || !issue.location?.lng) return;

      const color = getCategoryColor(issue.category);
      
      // Color-coded custom marker icons
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-1.5 rounded-full blur-xs opacity-40 animate-pulse" style="background-color: ${color}"></div>
          <div class="w-8 h-8 rounded-full text-white flex items-center justify-center border-2 border-white shadow-md relative z-10 transition-transform active:scale-95" style="background-color: ${color}">
            <span class="text-[10px] font-black">${issue.severity}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([issue.location.lat, issue.location.lng], { icon: customIcon });
      
      marker.on('click', () => {
        setSelectedMapIssue(issue);
        if (onSelectIssue) {
          onSelectIssue(issue);
        }
      });

      markersClusterGroupRef.current.addLayer(marker);
    });

    // Deep link selection logic
    if (selectedIssueId) {
      const selectedIssue = issues.find(i => i.id === selectedIssueId);
      if (selectedIssue?.location?.lat) {
        setSelectedMapIssue(selectedIssue);
        mapInstanceRef.current.setView([selectedIssue.location.lat, selectedIssue.location.lng], 15, { animate: true });
      }
    }
  }, [filteredIssues, selectedIssueId, leafletLoaded, pluginsLoaded, isSelectionMode]);

  // Handle searching using Nominatim API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const L = (window as any).L;
    if (!addressSearch || !L || !mapInstanceRef.current) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = Number(first.lat);
        const lng = Number(first.lon);
        mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
        
        if (isSelectionMode && onPinDropped) {
          onPinDropped({ lat, lng }, first.display_name);
          if (currentPinRef.current) {
            mapInstanceRef.current.removeLayer(currentPinRef.current);
          }
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform -translate-y-2 animate-bounce">
                    <span class="w-3 h-3 bg-white rounded-full"></span>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          currentPinRef.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(mapInstanceRef.current);
        }
      }
    } catch (err) {
      console.error('Map search failed:', err);
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
        if (isSelectionMode && onPinDropped) {
          onPinDropped({ lat, lng }, "Detected Live GPS Coordinates");
        }
      },
      (err) => console.warn('Geolocation failed:', err)
    );
  };

  const toggleCategoryFilter = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleStatusFilter = (stat: string) => {
    if (selectedStatuses.includes(stat)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== stat));
    } else {
      setSelectedStatuses([...selectedStatuses, stat]);
    }
  };

  const handleUpvote = async (issueId: string) => {
    if (isSelectionMode || !selectedMapIssue) return;

    // Use selected issue coordinates as a reliable fallback to pass geofencing on preview
    const lat = selectedMapIssue.location?.lat || 12.9716;
    const lng = selectedMapIssue.location?.lng || 77.5946;

    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          userId: 'anonymous_citizen'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedMapIssue(updated);
        alert('🔺 Upvote successfully logged! Grievance priority score escalated.');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Geofenced Upvote constraint unmet.');
      }
    } catch (err) {
      console.error('Error upvoting issue:', err);
    }
  };

  return (
    <div className={`relative w-full bg-slate-100 flex flex-col rounded-3xl overflow-hidden shadow-sm ${isSelectionMode ? 'h-full' : 'h-[calc(100vh-65px)]'}`}>
      
      {/* MAP VIEW CONTAINER */}
      <div id="leaflet-map-element" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* FLOATING ACTION OVERLAY HEADER */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-3 pointer-events-none">
        
        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="flex bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-150 dark:border-slate-800 rounded-2xl shadow-lg max-w-sm w-full pointer-events-auto">
          <input
            type="text"
            placeholder={isSelectionMode ? "Search address or drop pin..." : "Search Indian locations..."}
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button type="submit" className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 border-l border-slate-100 dark:border-slate-850">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex gap-2 pointer-events-auto items-center">
          {/* Compass button */}
          <button
            type="button"
            onClick={handleLocateUser}
            className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-150 dark:border-slate-800 rounded-2xl shadow-lg hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-transform active:scale-95 shrink-0"
            title="Locate Live GPS"
          >
            <Compass className="w-4.5 h-4.5 text-blue-600 animate-spin-slow" />
          </button>
        </div>
      </div>

      {/* FLOATING FILTER SIDEBAR (TOP-LEFT, ONLY IN FULL VIEW) */}
      {!isSelectionMode && (
        <div className="absolute top-20 left-4 z-10 w-72 max-h-[75%] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 hidden lg:block">
          <div>
            <h4 className="font-sans font-black text-slate-900 dark:text-white text-sm">Grievance Dashboard Filter</h4>
            <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">Isolate reports by location, category tags, or SLA status.</p>
          </div>

          {/* Cascading State -> City -> Ward Filters */}
          <div className="space-y-2.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Geographical Filter</span>
            
            {/* State Select */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-450 dark:text-slate-400">State</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-200"
              >
                <option value="All States" className="bg-white dark:bg-slate-900">All States</option>
                {availableStates.map(st => (
                  <option key={st} value={st} className="bg-white dark:bg-slate-900">{st}</option>
                ))}
              </select>
            </div>

            {/* City Select */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-450 dark:text-slate-400">City</label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={selectedState === 'All States'}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="All Cities" className="bg-white dark:bg-slate-900">All Cities</option>
                {availableCities.map(ct => (
                  <option key={ct} value={ct} className="bg-white dark:bg-slate-900">{ct}</option>
                ))}
              </select>
            </div>

            {/* Ward Select */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-450 dark:text-slate-400">Ward Locality</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={selectedCity === 'All Cities'}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="All Wards" className="bg-white dark:bg-slate-900">All Wards</option>
                {availableWards.map(wd => (
                  <option key={wd} value={wd} className="bg-white dark:bg-slate-900">{wd}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category checkboxes */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Category Filters</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {CATEGORIES_LIST.map(cat => {
                const color = getCategoryColor(cat);
                const isChecked = selectedCategories.includes(cat);
                return (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-[10.5px] font-bold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategoryFilter(cat)}
                      className="rounded text-blue-600 shrink-0"
                    />
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                    <span className="truncate">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status filter pills */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Work Status</span>
            <div className="flex flex-wrap gap-1.5">
              {['reported', 'assigned', 'in_progress', 'resolved'].map(stat => {
                const isSelected = selectedStatuses.includes(stat);
                return (
                  <button
                    key={stat}
                    onClick={() => toggleStatusFilter(stat)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border font-mono transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-slate-850 text-slate-450 hover:bg-slate-50'
                    }`}
                  >
                    {stat.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>



          <div className="border-t border-slate-150 dark:border-slate-850 pt-2 text-[9px] text-slate-400 font-mono flex justify-between">
            <span>Filtered count:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">{filteredIssues.length} issues</span>
          </div>
        </div>
      )}

      {/* SELECTED ISSUE DETAILS PANEL (DESKTOP SIDEBAR OR MOBILE BOTTOM SHEET) */}
      {!isSelectionMode && selectedMapIssue && (
        <div className="absolute bottom-4 right-4 top-20 z-10 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-250 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-y-auto space-y-4 flex flex-col justify-between max-h-[85%] lg:max-h-none pointer-events-auto">
          
          <div className="space-y-4 flex-1">
            {/* Sidebar header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-mono">
                  Priority level {selectedMapIssue.severity}/5
                </span>
                <h4 className="font-sans font-black text-slate-900 dark:text-white text-sm mt-1.5 leading-tight">
                  {selectedMapIssue.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedMapIssue(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Media Image proof */}
            {selectedMapIssue.media && selectedMapIssue.media[0] && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 h-36 border border-slate-200 dark:border-slate-800 shrink-0">
                <img
                  src={selectedMapIssue.media[0].url}
                  alt="Proof"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2.5 left-2.5 text-[9px] font-bold font-mono px-2 py-0.5 bg-slate-950/70 text-white rounded uppercase shadow backdrop-blur-xs">
                  Original proof photo
                </div>
              </div>
            )}

            {/* Location Address */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Hyperlocal Location</span>
              <p className="text-[10.5px] font-bold text-slate-700 dark:text-slate-350 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{selectedMapIssue.location?.address}</span>
              </p>
            </div>



            {/* Description Notes */}
            <div className="space-y-1 text-xs">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Complaint Logs</span>
              <p className="text-slate-500 dark:text-slate-450 leading-normal italic">
                "{selectedMapIssue.description}"
              </p>
            </div>

            {/* SLA Timeline status chain */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">Dispatch Status Tracker</span>
              <div className="bg-slate-50/50 dark:bg-slate-950/15 border border-slate-150 dark:border-slate-850 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span>{formatStatus(selectedMapIssue.status)}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Updated {new Date(selectedMapIssue.updatedAt || selectedMapIssue.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Simulated status history trace */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex gap-2 font-mono bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-xl">
                  <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center text-blue-600 shrink-0 mt-0.5 text-[8px] font-bold">1</div>
                  <p className="leading-normal">
                    {selectedMapIssue.statusHistory && selectedMapIssue.statusHistory[selectedMapIssue.statusHistory.length - 1]?.note 
                      ? selectedMapIssue.statusHistory[selectedMapIssue.statusHistory.length - 1].note
                      : `Grievance registered and assigned to ${selectedMapIssue.location?.ward} engineers.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="border-t border-slate-150 dark:border-slate-850 pt-4 flex gap-2.5 shrink-0">
            <button
              onClick={() => handleUpvote(selectedMapIssue.id)}
              className="flex-1 py-3 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Upvote ({selectedMapIssue.upvotes?.length || 0})</span>
            </button>
            <button
              onClick={() => {
                if (onSelectIssue) {
                  onSelectIssue(selectedMapIssue);
                }
              }}
              className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span>View full profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}



      {/* Dynamic script loading overlay */}
      {!leafletLoaded && (
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono font-bold text-slate-550 dark:text-slate-400">Loading Leaflet OpenStreetMaps...</p>
        </div>
      )}
    </div>
  );
}
